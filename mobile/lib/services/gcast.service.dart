import 'dart:async';

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
// ignore: import_rule_openapi, we are only using the AssetMediaSize enum
import 'package:openapi/api.dart';

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
  int? _sessionId;
  Timer? _mediaStatusPollingTimer;

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
      onReceiverName?.call("");
    }
  }

  void _onCastMessageCallback(Map<String, dynamic> message) {
    switch (message['type']) {
      case "MEDIA_STATUS":
        _handleMediaStatus(message);
        break;
    }
  }

  void _handleMediaStatus(Map<String, dynamic> message) {
    final statusList =
        (message['status'] as List).whereType<Map<String, dynamic>>().toList();

    if (statusList.isEmpty) {
      return;
    }

    final status = statusList[0];
    switch (status['playerState']) {
      case "PLAYING":
        onCastState?.call(CastState.playing);
        break;
      case "PAUSED":
        onCastState?.call(CastState.paused);
        break;
      case "BUFFERING":
        onCastState?.call(CastState.buffering);
        break;
      case "IDLE":
        onCastState?.call(CastState.idle);

        // stop polling for media status if the video finished playing
        if (status["idleReason"] == "FINISHED") {
          _mediaStatusPollingTimer?.cancel();
        }

        break;
    }

    if (status["media"] != null && status["media"]["duration"] != null) {
      final duration = Duration(
        milliseconds: (status["media"]["duration"] * 1000 ?? 0).toInt(),
      );
      onDuration?.call(duration);
    }

    if (status["mediaSessionId"] != null) {
      _sessionId = status["mediaSessionId"];
    }

    if (status["currentTime"] != null) {
      final currentTime =
          Duration(milliseconds: (status["currentTime"] * 1000 ?? 0).toInt());
      onCurrentTime?.call(currentTime);
    }
  }

  @override
  Future<void> connect(dynamic device) async {
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
  Future<void> disconnect() async {
    onReceiverName?.call("");
    currentAssetId = null;
    await _gCastRepository.disconnect();
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
    final bufferedExpiration =
        tokenExpiration.subtract(const Duration(seconds: 10));

    return bufferedExpiration.isAfter(DateTime.now());
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
    if (!isSessionValid()) {
      sessionKey = await _sessionsApiService.createSession(
        "Cast",
        "Google Cast",
        duration: const Duration(minutes: 15).inSeconds,
      );
    }

    final unauthenticatedUrl = asset.isVideo
        ? getPlaybackUrlForRemoteId(
            asset.remoteId!,
          )
        : getThumbnailUrlForRemoteId(
            asset.remoteId!,
            type: AssetMediaSize.fullsize,
          );

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

    currentAssetId = asset.remoteId;

    // we need to poll for media status since the cast device does not
    // send a message when the media is loaded for whatever reason
    // only do this on videos
    _mediaStatusPollingTimer?.cancel();

    if (asset.isVideo) {
      _mediaStatusPollingTimer =
          Timer.periodic(const Duration(milliseconds: 500), (timer) {
        if (isConnected) {
          _gCastRepository.sendMessage(CastSession.kNamespaceMedia, {
            "type": "GET_STATUS",
            "mediaSessionId": _sessionId,
          });
        } else {
          timer.cancel();
        }
      });
    }
  }

  @override
  void play() {
    _gCastRepository.sendMessage(CastSession.kNamespaceMedia, {
      "type": "PLAY",
      "mediaSessionId": _sessionId,
    });
  }

  @override
  void pause() {
    _gCastRepository.sendMessage(CastSession.kNamespaceMedia, {
      "type": "PAUSE",
      "mediaSessionId": _sessionId,
    });
  }

  @override
  void seekTo(Duration position) {
    _gCastRepository.sendMessage(CastSession.kNamespaceMedia, {
      "type": "SEEK",
      "mediaSessionId": _sessionId,
      "currentTime": position.inSeconds,
    });
  }

  @override
  void stop() {
    _gCastRepository.sendMessage(CastSession.kNamespaceMedia, {
      "type": "STOP",
      "mediaSessionId": _sessionId,
    });
    _mediaStatusPollingTimer?.cancel();

    currentAssetId = null;
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
        .where((device) => device.$3.extras["md"] != "Chromecast Audio")
        .toList(growable: false);
  }
}
