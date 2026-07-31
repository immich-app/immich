import 'package:fcast_sender_sdk/fcast_sender_sdk.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/constants.dart';
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
    _castRepository.onConnectionState = _onConnectionState;
    _castRepository.onDeviceEvent = _onDeviceEvent;
  }

  void _onConnectionState(DeviceConnectionState state) {
    if (state is DeviceConnectionState_Connected) {
      isConnected = true;

      onConnectionState?.call(true);
    } else if (state is DeviceConnectionState_Disconnected) {
      isConnected = false;
      currentAssetId = null;

      onConnectionState?.call(false);
      onReceiverName?.call("");
    }
  }

  void _onDeviceEvent(DeviceEvent event) {
    switch (event) {
      case DeviceEvent_PlaybackStateChanged():
        _handlePlaybackState(event.newPlaybackState);
      case DeviceEvent_TimeChanged():
        onCurrentTime?.call(Duration(seconds: event.newTime.toInt()));
      case DeviceEvent_DurationChanged():
        onDuration?.call(Duration(seconds: event.newDuration.toInt()));
      default:
        break;
    }
  }

  void _handlePlaybackState(PlaybackState state) {
    switch (state) {
      case PlaybackState.playing:
        onCastState?.call(CastState.playing);
      case PlaybackState.paused:
        onCastState?.call(CastState.paused);
      case PlaybackState.buffering:
        onCastState?.call(CastState.buffering);
      case PlaybackState.idle:
      case PlaybackState.ended:
        onCastState?.call(CastState.idle);
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

    // we want to make sure we have at least 1 minute remaining in the session
    // this is to account for network latency and other delays when sending the request
    final bufferedExpiration = tokenExpiration.subtract(kCastSessionRenewalBuffer);

    return bufferedExpiration.isAfter(DateTime.now());
  }

  Future<void> loadMedia(RemoteAsset asset, bool reload) async {
    if (!isConnected) {
      return;
    } else if (asset.id == currentAssetId && !reload) {
      return;
    }

    // create a session key
    if (!isSessionValid()) {
      sessionKey = await _sessionsApiService.createSession(
        kCastDeviceType,
        kCastDeviceOS,
        duration: kCastSessionDuration.inSeconds,
      );
    }

    // get image mime type
    final mimeType = await _assetApiRepository.getAssetMIMEType(asset.id);

    if (mimeType == null) {
      return;
    }

    final baseUrl = asset.isVideo
        ? getPlaybackUrlForRemoteId(asset.id)
        : getThumbnailUrlForRemoteId(asset.id, type: AssetMediaSize.fullsize);

    final authenticatedUrl = "$baseUrl&sessionKey=${sessionKey?.token}";

    final request = asset.isVideo
        ? LoadRequest.video(contentType: mimeType, url: authenticatedUrl, resumePosition: 0.0)
        : LoadRequest.image(contentType: mimeType, url: authenticatedUrl);

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

  bool hasDisplayCapability(int capabilities) => (capabilities & 0x01) != 0;

  Future<List<(String, CastDestinationType, dynamic)>> getDevices() async {
    final dests = await _castRepository.listDestinations();

    final fCastDevices = dests.where((dest) => dest.$1.protocol == ProtocolType.fCast).map((dest) => dest.$1);
    final fCastNames = fCastDevices.map((device) => device.name).toSet();
    final fCastAddresses = fCastDevices.expand((device) => device.addresses).toSet();

    bool hasFCastTwin(DeviceInfo device) =>
        fCastNames.contains(device.name) || device.addresses.any(fCastAddresses.contains);

    return dests
        .where((dest) {
          final (device, gcastCaps) = dest;

          return switch (device.protocol) {
            ProtocolType.fCast => true,
            ProtocolType.chromecast => hasDisplayCapability(gcastCaps ?? 0) && !hasFCastTwin(device),
          };
        })
        .map((dest) {
          final device = dest.$1;
          final type = switch (device.protocol) {
            ProtocolType.fCast => CastDestinationType.fCast,
            ProtocolType.chromecast => CastDestinationType.googleCast,
          };

          return (device.name, type, device as dynamic);
        })
        .toList(growable: false);
  }
}
