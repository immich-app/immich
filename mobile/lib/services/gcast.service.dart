import 'package:cast/device.dart';
import 'package:cast/session.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/interfaces/cast_destination_service.interface.dart';
import 'package:immich_mobile/models/cast/cast_manager_state.dart';
import 'package:immich_mobile/models/sessions/session_create_response.model.dart';
import 'package:immich_mobile/repositories/asset_api.repository.dart';
import 'package:immich_mobile/repositories/gcast.repository.dart';
import 'package:immich_mobile/repositories/sessions_api.repository.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:immich_mobile/utils/url_helper.dart';

final gCastServiceProvider = Provider(
  (ref) => GCastService(
    ref.watch(gCastRepositoryProvider),
    ref.watch(sessionsAPIRepositoryProvider),
    ref.watch(assetApiRepositoryProvider),
  ),
);

class GCastService implements ICastDestinationService {
  final GCastRepository _gCastRepository;
  final SessionsAPIRepository _sessionsApiService;
  final AssetApiRepository _assetApiRepository;

  SessionCreateResponse? sessionKey;
  String? currentAssetId;
  bool isConnected = false;

  @override
  void Function(bool)? onConnectionState;
  @override
  void Function(Duration)? onCurrentTime;
  @override
  void Function(Duration)? onDuration;
  @override
  void Function(String)? onReceiverName;
  @override
  void Function(CastState)? onCastState;

  GCastService(
    this._gCastRepository,
    this._sessionsApiService,
    this._assetApiRepository,
  ) {
    _gCastRepository.onCastStatus = _onCastStatusCallback;
    _gCastRepository.onCastMessage = _onCastMessageCallback;
  }

  void _onCastStatusCallback(CastSessionState state) {
    if (state == CastSessionState.connected) {
      onConnectionState?.call(true);
      isConnected = true;
    } else if (state == CastSessionState.closed) {
      onConnectionState?.call(false);
      isConnected = false;
    }
  }

  void _onCastMessageCallback(Map<String, dynamic> message) {
    final msgType = message['type'];
  }

  Future<void> connect(CastDevice device) async {
    await _gCastRepository.connect(device);

    onReceiverName?.call(device.extras["fn"] ?? "Google Cast");
  }

  @override
  CastDestinationType getType() {
    return CastDestinationType.googleCast;
  }

  @override
  Future<bool> initialize() async {
    // check if server URL is https
    final serverUrl = punycodeDecodeUrl(Store.tryGet(StoreKey.serverEndpoint));

    return serverUrl?.startsWith("https://") ?? false;
  }

  @override
  void disconnect() {
    _gCastRepository.disconnect();

    onReceiverName?.call("");
  }

  @override
  bool isAvailable() {
    // check if server URL is https
    final serverUrl = punycodeDecodeUrl(Store.tryGet(StoreKey.serverEndpoint));

    return serverUrl?.startsWith("https://") ?? false;
  }

  @override
  void loadMedia(Asset asset, bool reload) async {
    if (!isConnected) {
      return;
    } else if (asset.remoteId == null) {
      return;
    } else if (asset.remoteId == currentAssetId && !reload) {
      return;
    }

    // create a session key
    sessionKey ??= await _sessionsApiService.createSession(
      "Cast",
      "Google Cast",
      duration: const Duration(minutes: 15).inSeconds,
    );

    final unauthenticatedUrl = asset.isVideo
        ? getPlaybackUrlForRemoteId(
            asset.remoteId!,
          )
        : getThumbnailUrlForRemoteId(asset.remoteId!);

    final authenticatedURL =
        "$unauthenticatedUrl&sessionKey=${sessionKey?.token}";

    // get image mime type
    final mimeType =
        await _assetApiRepository.getAssetMIMEType(asset.remoteId!);

    if (mimeType == null) {
      return;
    }

    _gCastRepository.sendMessage(CastSession.kNamespaceMedia, {
      "type": "LOAD",
      "media": {
        "contentId": authenticatedURL,
        "streamType": "BUFFERED",
        "contentType": mimeType,
        "contentUrl": authenticatedURL,
      },
      "autoplay": true,
    });
  }

  @override
  void play() {
    // TODO: implement play
  }

  @override
  void pause() {
    // TODO: implement pause
  }

  @override
  void seekTo(Duration position) {
    // TODO: implement seekTo
  }

  @override
  Future<List<(String, CastDestinationType, dynamic)>> getDevices() async {
    final dests = await _gCastRepository.listDestinations();

    return dests
        .map(
          (device) => (
            device.extras["fn"] ?? "Google Cast",
            CastDestinationType.googleCast,
            device
          ),
        )
        .toList(growable: false);
  }
}
