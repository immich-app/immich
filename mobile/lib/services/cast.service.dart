import 'dart:async';

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
  Timer? _connectTimeout;

  void Function(CastConnection)? onConnectionState;

  void Function(Duration)? onCurrentTime;

  void Function(Duration)? onDuration;

  void Function(String?)? onReceiverName;

  void Function(CastState)? onCastState;

  CastService(this._castRepository, this._sessionsApiService, this._assetApiRepository) {
    _castRepository.onConnectionState = _onConnectionState;
    _castRepository.onDeviceEvent = _onDeviceEvent;
    _castRepository.init();
  }

  void _onConnectionState(DeviceConnectionState state) {
    switch (state) {
      case DeviceConnectionState_Connected():
        _connectTimeout?.cancel();
        isConnected = true;

        onConnectionState?.call(CastConnection.connected);
      case DeviceConnectionState_Connecting() || DeviceConnectionState_Reconnecting():
        onConnectionState?.call(CastConnection.connecting);
      case DeviceConnectionState_Disconnected():
        _connectTimeout?.cancel();
        isConnected = false;
        currentAssetId = null;

        onConnectionState?.call(CastConnection.idle);
        onReceiverName?.call(null);
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
    onCastState?.call(CastState.fromPlaybackState(state));
  }

  Future<void> connect(dynamic device) async {
    final name = device.name as String;

    _connectTimeout?.cancel();
    onReceiverName?.call(name);
    onConnectionState?.call(CastConnection.connecting);

    try {
      await _castRepository.connect(device);
    } catch (_) {
      onConnectionState?.call(CastConnection.failed);
      return;
    }

    _connectTimeout = Timer(kCastConnectTimeout, () => unawaited(_giveUpConnecting(name)));
  }

  Future<void> _giveUpConnecting(String name) async {
    await _castRepository.disconnect();

    onReceiverName?.call(name);
    onConnectionState?.call(CastConnection.failed);
  }

  Future<void> disconnect() async {
    _connectTimeout?.cancel();
    onReceiverName?.call(null);
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

  Stream<CastDiscoveryUpdate> get discovery =>
      _castRepository.discovery.map((update) => (status: update.status, devices: _toDestinations(update.devices)));

  List<CastDestination> _toDestinations(List<(DeviceInfo, int?)> dests) {
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
