import 'package:cast/device.dart';
import 'package:cast/session.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/interfaces/cast_destination_service.interface.dart';
import 'package:immich_mobile/models/cast_manager_state.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/repositories/gcast.repository.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:immich_mobile/utils/url_helper.dart';
import 'package:openapi/api.dart' as api;
import 'package:uuid/uuid.dart';

final gCastServiceProvider = Provider(
  (ref) => GCastService(
      ref.watch(gCastRepositoryProvider), ref.watch(apiServiceProvider)),
);

class GCastService implements ICastDestinationService {
  final GCastRepository _gCastRepository;
  final ApiService _apiService;

  api.SessionCreateResponseDto? sessionKey;
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

  GCastService(this._gCastRepository, this._apiService) {
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

    print(message);

    if (msgType == 'RECEIVER_STATUS') {
      print("Got receiver status");
    }
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
    print("Casting media: ${asset.remoteId}");

    if (!isConnected) {
      return;
    } else if (asset.remoteId == null) {
      return;
    } else if (asset.remoteId == currentAssetId && !reload) {
      return;
    }

    // create a session key
    sessionKey ??= await _apiService.sessionsApi.createSession(
      api.SessionCreateDto(
        deviceOS: "Google Cast",
        deviceType: "Google Cast",
        duration: const Duration(minutes: 15).inSeconds,
      ),
    );

    final unauthenticatedUrl = asset.isVideo
        ? getOriginalUrlForRemoteId(
            asset.remoteId!,
          )
        : getThumbnailUrlForRemoteId(
            asset.remoteId!,
            type: api.AssetMediaSize.thumbnail,
          );

    final authenticatedURL =
        "$unauthenticatedUrl&sessionKey=${sessionKey?.token}";

    // get image mime type
    final info = await _apiService.assetsApi.getAssetInfo(asset.remoteId!);
    final mimeType = info?.originalMimeType;

    if (mimeType == null) {
      return;
    }

    _gCastRepository.sendMessage(CastSession.kNamespaceMedia, {
      "type": "LOAD",
      "media": {
        "contentId": authenticatedURL,
        "streamType": "LIVE",
        "contentType": mimeType,
        "contentUrl": authenticatedURL,
      },
      "autoplay": true,
    });

    print("Sending message: $authenticatedURL");
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
