import 'package:fcast_sender_sdk/fcast_sender_sdk.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/models/cast/cast_manager_state.dart';
import 'package:immich_mobile/models/sessions/session_create_response.model.dart';
import 'package:immich_mobile/repositories/asset_api.repository.dart';
import 'package:immich_mobile/repositories/cast.repository.dart';
import 'package:immich_mobile/repositories/sessions_api.repository.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
// ignore: import_rule_openapi, we are only using the AssetMediaSize enum
import 'package:openapi/api.dart';

final castServiceProvider = Provider(
  (ref) => CastService(
    ref.watch(castRepositoryProvider),
    ref.watch(sessionsAPIRepositoryProvider),
    ref.watch(assetApiRepositoryProvider),
  ),
);

class CastService {
  final CastRepository _castRepository;
  final SessionsAPIRepository _sessionsApiService;
  final AssetApiRepository _assetApiRepository;

  SessionCreateResponse? sessionKey;
  String? currentAssetId;
  bool isConnected = false;

  void Function(bool)? onConnectionState;

  void Function(Duration)? onCurrentTime;

  void Function(Duration)? onDuration;

  void Function(String)? onReceiverName;

  void Function(CastState)? onCastState;

  CastService(this._castRepository, this._sessionsApiService, this._assetApiRepository) {
    _castRepository.onConnectionState = _onCastStatusCallback;
    _castRepository.onDeviceEvent = _onDeviceEventCallback;
  }

  void _onCastStatusCallback(DeviceConnectionState state) {
    if (state is DeviceConnectionState_Connected) {
      onConnectionState?.call(true);
      isConnected = true;
    } else if (state is DeviceConnectionState_Disconnected) {
      onConnectionState?.call(false);
      isConnected = false;
      onReceiverName?.call("");
      currentAssetId = null;
    }
  }

  void _onDeviceEventCallback(DeviceEvent event) {
    switch (event) {
      case DeviceEvent_PlaybackStateChanged():
        _handlePlaybackState(event.newPlaybackState);
        break;
      case DeviceEvent_TimeChanged():
        onCurrentTime?.call(Duration(milliseconds: (event.newTime * 1000).toInt()));
        break;
      case DeviceEvent_DurationChanged():
        onDuration?.call(Duration(milliseconds: (event.newDuration * 1000).toInt()));
        break;
      default:
        break;
    }
  }

  void _handlePlaybackState(PlaybackState state) {
    switch (state) {
      case PlaybackState.playing:
        onCastState?.call(CastState.playing);
        break;
      case PlaybackState.paused:
        onCastState?.call(CastState.paused);
        break;
      case PlaybackState.buffering:
        onCastState?.call(CastState.buffering);
        break;
      case PlaybackState.idle:
        onCastState?.call(CastState.idle);
        break;
    }
  }

  Future<void> connect(dynamic device) async {
    await _castRepository.connect(device);

    onReceiverName?.call(device.name);
  }

  Future<void> disconnect() async {
    onReceiverName?.call("");
    currentAssetId = null;
    await _castRepository.disconnect();
  }

  bool isSessionValid() {
    // check if we already have a session token
    // we should always have a expiration date
    if (sessionKey == null || sessionKey?.expiresAt == null) {
      return false;
    }

    final tokenExpiration = DateTime.parse(sessionKey!.expiresAt!);

    // we want to make sure we have at least 10 seconds remaining in the session
    // this is to account for network latency and other delays when sending the request
    final bufferedExpiration = tokenExpiration.subtract(const Duration(seconds: 10));

    return bufferedExpiration.isAfter(DateTime.now());
  }

  void loadMedia(RemoteAsset asset, bool reload) async {
    if (!isConnected) {
      return;
    } else if (asset.id == currentAssetId && !reload) {
      return;
    }

    // create a session key
    if (!isSessionValid()) {
      sessionKey = await _sessionsApiService.createSession(
        "Cast",
        "Cast",
        duration: const Duration(minutes: 15).inSeconds,
      );
    }

    final unauthenticatedUrl = asset.isVideo
        ? getPlaybackUrlForRemoteId(asset.id)
        : getThumbnailUrlForRemoteId(asset.id, type: AssetMediaSize.fullsize);

    final authenticatedURL = "$unauthenticatedUrl&sessionKey=${sessionKey?.token}";

    // get image mime type
    final mimeType = await _assetApiRepository.getAssetMIMEType(asset.id);

    if (mimeType == null) {
      return;
    }

    final request = asset.isVideo
        ? LoadRequest.video(contentType: mimeType, url: authenticatedURL, resumePosition: 0.0)
        : LoadRequest.image(contentType: mimeType, url: authenticatedURL);

    _castRepository.loadMedia(request);

    currentAssetId = asset.id;
  }

  void play() {
    _castRepository.play();
  }

  void pause() {
    _castRepository.pause();
  }

  void seekTo(Duration position) {
    _castRepository.seekTo(position);
  }

  void stop() {
    _castRepository.stop();

    currentAssetId = null;
  }

  // 0x01 is display capability bitmask
  bool isDisplay(int ca) => (ca & 0x01) != 0;

  Future<List<(String, CastDestinationType, dynamic)>> getDevices() async {
    final dests = await _castRepository.listDestinations();

    final fCastNames = dests
        .where((dest) => dest.$1.protocol == ProtocolType.fCast)
        .map((dest) => dest.$1.name)
        .toSet();

    return dests
        .where((dest) {
          final (device, gcastCaps) = dest;

          if (device.protocol == ProtocolType.fCast) {
            return true;
          }

          return isDisplay(gcastCaps ?? 0) && !fCastNames.contains(device.name);
        })
        .map((dest) {
          final device = dest.$1;
          final type = device.protocol == ProtocolType.fCast
              ? CastDestinationType.fCast
              : CastDestinationType.googleCast;

          return (device.name, type, device as dynamic);
        })
        .toList(growable: false);
  }
}
