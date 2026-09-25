import 'dart:async';
import 'dart:io';

import 'package:cast/session.dart';
import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:http/http.dart' as http;
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/models/cast/cast_manager_state.dart';
import 'package:immich_mobile/models/sessions/session_create_response.model.dart';
import 'package:immich_mobile/repositories/gcast.repository.dart';
import 'package:immich_mobile/repositories/sessions_api.repository.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/services/server_info.service.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:logging/logging.dart';
// ignore: import_rule_openapi, we are only using the AssetMediaSize enum
import 'package:openapi/api.dart';

final gCastServiceProvider = Provider(
  (ref) => GCastService(
    ref.watch(gCastRepositoryProvider),
    ref.watch(sessionsAPIRepositoryProvider),
    () async => (await ref.read(serverInfoServiceProvider).getServerConfig())?.castReceiverAppId ?? '',
  ),
);

class GCastService {
  static final _log = Logger('GCastService');
  static const _volumeChannel = MethodChannel('app.immich/cast_volume');
  static const photoNamespace = 'urn:x-cast:app.immich.photos';
  final GCastRepository _gCastRepository;
  final SessionsAPIRepository _sessionsApiService;
  final Future<String> Function() _getReceiverAppId;

  SessionCreateResponse? sessionKey;
  String? currentAssetId;
  String? _currentSourceUrl;
  String? _pendingAssetId;
  String? _pendingSourceUrl;
  String? _pendingCastUrl;
  DateTime? _pendingSelectedAt;
  int? _pendingRequestId;
  int _nextRequestId = 0;
  bool isConnected = false;
  int? _sessionId;
  Timer? _mediaStatusPollingTimer;
  Future<SessionCreateResponse>? _sessionFuture;
  final Map<String, Future<String>> _mimeTypes = {};
  int _selectionGeneration = 0;
  int _credentialGeneration = 0;
  bool _customReceiver = false;
  RemoteAsset? _selectedPhoto;
  RemoteAsset? _previousPhoto;
  RemoteAsset? _nextPhoto;
  double? _receiverVolumeLevel;
  double _receiverVolumeStep = 0.05;
  bool _receiverVolumeMuted = false;
  bool _receiverVolumeFixed = false;
  bool _castingVideo = false;
  bool _hardwareVolumeKeysActive = false;
  DateTime? _lastVolumeKeyAt;

  void Function(bool)? onConnectionState;

  void Function(Duration)? onCurrentTime;

  void Function(Duration)? onDuration;

  void Function(String)? onReceiverName;

  void Function(CastState)? onCastState;

  GCastService(this._gCastRepository, this._sessionsApiService, this._getReceiverAppId) {
    _gCastRepository.onCastStatus = _onCastStatusCallback;
    _gCastRepository.onCastMessage = _onCastMessageCallback;
    if (Platform.isAndroid) {
      _volumeChannel.setMethodCallHandler((call) async {
        if (call.method == 'volumeKey' && call.arguments is int) {
          changeReceiverVolume(call.arguments as int);
        }
      });
    }
  }

  void _updateHardwareVolumeKeys() {
    if (!Platform.isAndroid) {
      return;
    }
    final active = isConnected && _castingVideo && _receiverVolumeLevel != null && !_receiverVolumeFixed;
    if (active == _hardwareVolumeKeysActive) {
      return;
    }
    _hardwareVolumeKeysActive = active;
    unawaited(_volumeChannel.invokeMethod<void>('setActive', active).catchError((Object error) {
      _log.fine('Unable to route volume keys to Cast', error);
    }));
  }

  void changeReceiverVolume(int direction) {
    final level = _receiverVolumeLevel;
    if (!isConnected || !_castingVideo || _receiverVolumeFixed || level == null || direction == 0) {
      return;
    }
    final next = (level + _receiverVolumeStep * direction.sign).clamp(0.0, 1.0).toDouble();
    if (next == level && !(direction > 0 && _receiverVolumeMuted)) {
      return;
    }
    try {
      _gCastRepository.sendMessage(CastSession.kNamespaceReceiver, {
        'type': 'SET_VOLUME',
        'volume': {'level': next, if (direction > 0 && _receiverVolumeMuted) 'muted': false},
      });
    } catch (error, stack) {
      _log.warning('Unable to change Cast receiver volume', error, stack);
      _castingVideo = false;
      _updateHardwareVolumeKeys();
      return;
    }
    _receiverVolumeLevel = next;
    _lastVolumeKeyAt = DateTime.now();
    if (direction > 0) {
      _receiverVolumeMuted = false;
    }
  }

  void _handleReceiverStatus(Map<String, dynamic> message) {
    final status = message['status'];
    if (status is! Map || status['volume'] is! Map) {
      return;
    }
    final volume = status['volume'] as Map;
    final level = volume['level'];
    // A delayed status for an earlier key press must not undo newer presses.
    if (level is num &&
        (_lastVolumeKeyAt == null ||
            DateTime.now().difference(_lastVolumeKeyAt!) > const Duration(milliseconds: 500))) {
      _receiverVolumeLevel = level.toDouble().clamp(0.0, 1.0).toDouble();
    }
    final step = volume['stepInterval'];
    if (step is num && step > 0 && step <= 1) {
      _receiverVolumeStep = step.toDouble();
    }
    _receiverVolumeMuted = volume['muted'] == true;
    _receiverVolumeFixed = volume['controlType'] == 'FIXED';
    _updateHardwareVolumeKeys();
  }

  void _clearPending() {
    _pendingAssetId = null;
    _pendingSourceUrl = null;
    _pendingCastUrl = null;
    _pendingSelectedAt = null;
    _pendingRequestId = null;
  }

  void _onCastStatusCallback(CastSessionState state) {
    if (state == CastSessionState.closed) {
      onConnectionState?.call(false);
      isConnected = false;
      onReceiverName?.call("");
      currentAssetId = null;
      _currentSourceUrl = null;
      _clearPending();
      _selectionGeneration++;
      _credentialGeneration++;
      sessionKey = null;
      _sessionFuture = null;
      _mediaStatusPollingTimer?.cancel();
      _customReceiver = false;
      _selectedPhoto = null;
      _previousPhoto = null;
      _nextPhoto = null;
      _castingVideo = false;
      _updateHardwareVolumeKeys();
      _receiverVolumeLevel = null;
      _receiverVolumeStep = 0.05;
      _receiverVolumeMuted = false;
      _receiverVolumeFixed = false;
      _lastVolumeKeyAt = null;
    }
  }

  void _onCastMessageCallback(Map<String, dynamic> message) {
    switch (message['type']) {
      case 'RECEIVER_STATUS':
        _handleReceiverStatus(message);
      case "MEDIA_STATUS":
        _handleMediaStatus(message);
      case "LOAD_FAILED":
        if (_pendingRequestId != null && message['requestId'] == _pendingRequestId) {
          _clearPending();
          _mediaStatusPollingTimer?.cancel();
          _castingVideo = false;
          _updateHardwareVolumeKeys();
        }
      case "PHOTO_READY":
        if (_pendingRequestId != null && message['requestId'] == _pendingRequestId) {
          currentAssetId = _pendingAssetId;
          _currentSourceUrl = _pendingSourceUrl;
          _clearPending();
          _mediaStatusPollingTimer?.cancel();
          _sessionId = null;
          onCurrentTime?.call(Duration.zero);
          onDuration?.call(Duration.zero);
          onCastState?.call(CastState.idle);
        }
      case "PHOTO_ERROR":
        if (_pendingRequestId != null && message['requestId'] == _pendingRequestId) {
          _clearPending();
          _mediaStatusPollingTimer?.cancel();
          onCastState?.call(CastState.idle);
        }
    }
  }

  void _handleMediaStatus(Map<String, dynamic> message) {
    final statusList = (message['status'] as List).whereType<Map<String, dynamic>>().toList();

    if (statusList.isEmpty) {
      return;
    }

    final status = statusList[0];
    final contentId = status['media']?['contentId'];
    if (contentId != null && contentId == _pendingCastUrl) {
      if (_pendingSelectedAt != null) {
        final elapsed = DateTime.now().difference(_pendingSelectedAt!).inMilliseconds;
        _log.fine('Cast selection to media status: $elapsed ms');
      }
      currentAssetId = _pendingAssetId;
      _currentSourceUrl = _pendingSourceUrl;
      _clearPending();
      if (_currentSourceUrl?.contains('/thumbnail?') ?? false) {
        _mediaStatusPollingTimer?.cancel();
      }
    }
    switch (status['playerState']) {
      case "PLAYING":
        onCastState?.call(CastState.playing);
      case "PAUSED":
        onCastState?.call(CastState.paused);
      case "BUFFERING":
        onCastState?.call(CastState.buffering);
      case "IDLE":
        onCastState?.call(CastState.idle);
        if (status['idleReason'] == 'ERROR') {
          _clearPending();
          _mediaStatusPollingTimer?.cancel();
          _castingVideo = false;
          _updateHardwareVolumeKeys();
        }

        // stop polling for media status if the video finished playing
        if (status["idleReason"] == "FINISHED") {
          _mediaStatusPollingTimer?.cancel();
        }
    }

    if (status["media"] != null && status["media"]["duration"] != null) {
      final duration = Duration(milliseconds: (status["media"]["duration"] * 1000 ?? 0).toInt());
      onDuration?.call(duration);
    }

    if (status["mediaSessionId"] != null) {
      _sessionId = status["mediaSessionId"];
    }

    if (status["currentTime"] != null) {
      final currentTime = Duration(milliseconds: (status["currentTime"] * 1000 ?? 0).toInt());
      onCurrentTime?.call(currentTime);
    }
  }

  Future<void> connect(dynamic device) async {
    final appId = (await _getReceiverAppId()).trim();
    await _gCastRepository.connect(device, appId);
    _customReceiver = appId.isNotEmpty;
    isConnected = true;
    _updateHardwareVolumeKeys();
    onConnectionState?.call(true);

    onReceiverName?.call(device.extras["fn"] ?? "Google Cast");
  }

  Future<void> disconnect() async {
    _castingVideo = false;
    _updateHardwareVolumeKeys();
    _mediaStatusPollingTimer?.cancel();
    onReceiverName?.call("");
    currentAssetId = null;
    _currentSourceUrl = null;
    _clearPending();
    _selectionGeneration++;
    _credentialGeneration++;
    sessionKey = null;
    _sessionFuture = null;
    _customReceiver = false;
    _selectedPhoto = null;
    _previousPhoto = null;
    _nextPhoto = null;
    _receiverVolumeLevel = null;
    _receiverVolumeStep = 0.05;
    _receiverVolumeMuted = false;
    _receiverVolumeFixed = false;
    _lastVolumeKeyAt = null;
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
    final bufferedExpiration = tokenExpiration.subtract(const Duration(seconds: 10));

    return bufferedExpiration.isAfter(DateTime.now());
  }

  Future<SessionCreateResponse> _getSession() async {
    if (isSessionValid()) {
      return sessionKey!;
    }
    final generation = _credentialGeneration;
    final pending = _sessionFuture ??= _sessionsApiService.createSession(
      "Cast",
      "Google Cast",
      duration: const Duration(minutes: 15).inSeconds,
    );
    try {
      final session = await pending;
      if (generation != _credentialGeneration || !isConnected) {
        throw StateError('Cast disconnected while preparing credentials');
      }
      return sessionKey = session;
    } finally {
      if (generation == _credentialGeneration) {
        _sessionFuture = null;
      }
    }
  }

  Future<String> _getMimeType(String url, String token) {
    if (!_mimeTypes.containsKey(url) && _mimeTypes.length >= 256) {
      _mimeTypes.remove(_mimeTypes.keys.first);
    }
    return _mimeTypes.putIfAbsent(url, () async {
      try {
        final uri = Uri.parse(url);
        final authenticated = uri.replace(queryParameters: {
          ...uri.queryParameters,
          'sessionKey': token,
        });
        final response = await http.head(authenticated, headers: ApiService.getRequestHeaders());
        final contentType = response.headers['content-type']?.split(';').first;
        if (response.statusCode < 200 || response.statusCode >= 300 || contentType == null) {
          throw StateError('Unable to resolve Cast media type (${response.statusCode})');
        }
        return contentType;
      } catch (_) {
        _mimeTypes.remove(url);
        rethrow;
      }
    });
  }

  String _getPhotoUrl(RemoteAsset asset, AssetMediaSize size) {
    final revision = asset.thumbHash ?? asset.updatedAt.millisecondsSinceEpoch.toString();
    return getThumbnailUrlForRemoteId(asset.id, type: size, edited: asset.isEdited, thumbhash: revision);
  }

  Future<(String, String)> _resolveSource(RemoteAsset asset, String url, String token) async {
    try {
      return (url, await _getMimeType(url, token));
    } catch (_) {
      if (asset.isVideo) {
        rethrow;
      }
      final thumbnailUrl = _getPhotoUrl(asset, AssetMediaSize.thumbnail);
      return (thumbnailUrl, await _getMimeType(thumbnailUrl, token));
    }
  }

  Future<void> prepareMedia(RemoteAsset asset) async {
    if (!isConnected || !asset.isImage || _customReceiver) {
      return;
    }
    final session = await _getSession();
    await _resolveSource(asset, _getPhotoUrl(asset, AssetMediaSize.preview), session.token);
  }

  Future<void> loadMedia(RemoteAsset asset, bool reload) async {
    if (!isConnected) {
      return;
    }

    if (!asset.isVideo) {
      _castingVideo = false;
      _updateHardwareVolumeKeys();
    }

    final generation = ++_selectionGeneration;
    final selectedAt = DateTime.now();
    final unauthenticatedUrl =
        asset.isVideo ? getPlaybackUrlForRemoteId(asset.id) : _getPhotoUrl(asset, AssetMediaSize.preview);
    if ((_currentSourceUrl == unauthenticatedUrl || _pendingSourceUrl == unauthenticatedUrl) && !reload) {
      return;
    }

    _selectedPhoto = _customReceiver && asset.isImage ? asset : null;
    _previousPhoto = null;
    _nextPhoto = null;

    final session = await _getSession();
    final (resolvedUrl, mimeType) = _selectedPhoto != null
        ? (unauthenticatedUrl, 'image/*')
        : await _resolveSource(asset, unauthenticatedUrl, session.token);
    if (generation != _selectionGeneration || !isConnected) {
      return;
    }
    _log.fine('Cast selection to media ready: ${DateTime.now().difference(selectedAt).inMilliseconds} ms');
    final uri = Uri.parse(resolvedUrl);
    final authenticatedURL =
        uri.replace(queryParameters: {...uri.queryParameters, 'sessionKey': session.token}).toString();

    _pendingAssetId = asset.id;
    _pendingSourceUrl = unauthenticatedUrl;
    _pendingCastUrl = authenticatedURL;
    _pendingSelectedAt = selectedAt;
    try {
      if (_selectedPhoto != null) {
        _mediaStatusPollingTimer?.cancel();
        _sendPhoto(session.token);
        return;
      }

      _pendingRequestId = ++_nextRequestId;

      final media = <String, dynamic>{
        "contentId": authenticatedURL,
        "streamType": "BUFFERED",
        "contentType": mimeType,
        "contentUrl": authenticatedURL,
        if (_customReceiver) "customData": {"immichLoop": true},
      };
      if (asset.isVideo) {
        _gCastRepository.sendMessage(CastSession.kNamespaceMedia, {
          "type": "QUEUE_LOAD",
          "requestId": _pendingRequestId,
          "items": [
            {"media": media, "autoplay": true},
          ],
          "repeatMode": "REPEAT_SINGLE",
          "startIndex": 0,
        });
        _castingVideo = true;
        _updateHardwareVolumeKeys();
      } else {
        _gCastRepository.sendMessage(CastSession.kNamespaceMedia, {
          'type': 'LOAD',
          'requestId': _pendingRequestId,
          'media': media,
          'autoplay': true,
        });
      }
    } catch (_) {
      _clearPending();
      rethrow;
    }

    // we need to poll for media status since the cast device does not
    // send a message when the media is loaded for whatever reason
    _mediaStatusPollingTimer?.cancel();
    if (!asset.isVideo && _pendingCastUrl == null) {
      return;
    }
    var photoPollCount = 0;
    _mediaStatusPollingTimer = Timer.periodic(const Duration(milliseconds: 500), (timer) {
      if (isConnected) {
        if (!asset.isVideo && ++photoPollCount > 30) {
          _clearPending();
          timer.cancel();
          return;
        }
        final request = <String, dynamic>{"type": "GET_STATUS"};
        if (_pendingCastUrl == null && _sessionId != null) {
          request['mediaSessionId'] = _sessionId;
        }
        _gCastRepository.sendMessage(CastSession.kNamespaceMedia, request);
      } else {
        timer.cancel();
      }
    });
  }

  Map<String, String> _photoSource(RemoteAsset asset, String token) => {
        'url': _withSession(_getPhotoUrl(asset, AssetMediaSize.preview), token),
        'fallbackUrl': _withSession(_getPhotoUrl(asset, AssetMediaSize.thumbnail), token),
      };

  String _withSession(String url, String token) {
    final uri = Uri.parse(url);
    return uri.replace(queryParameters: {...uri.queryParameters, 'sessionKey': token}).toString();
  }

  void _sendPhoto(String token) {
    final photo = _selectedPhoto;
    if (photo == null) {
      return;
    }
    _pendingAssetId = photo.id;
    _pendingSourceUrl = _getPhotoUrl(photo, AssetMediaSize.preview);
    _pendingRequestId = ++_nextRequestId;
    _gCastRepository.sendMessage(photoNamespace, {
      'type': 'SHOW_PHOTO',
      'requestId': _pendingRequestId,
      'current': _photoSource(photo, token),
      if (_previousPhoto != null) 'previous': _photoSource(_previousPhoto!, token),
      if (_nextPhoto != null) 'next': _photoSource(_nextPhoto!, token),
    });
  }

  void setPhotoNeighbors(RemoteAsset current, RemoteAsset? previous, RemoteAsset? next) {
    if (!_customReceiver || !isConnected || _selectedPhoto?.id != current.id) {
      return;
    }
    _previousPhoto = previous;
    _nextPhoto = next;
    final token = sessionKey?.token;
    if (token != null && (_pendingAssetId == current.id || currentAssetId == current.id)) {
      _sendPhoto(token);
    }
  }

  void play() {
    _gCastRepository.sendMessage(CastSession.kNamespaceMedia, {"type": "PLAY", "mediaSessionId": _sessionId});
  }

  void pause() {
    _gCastRepository.sendMessage(CastSession.kNamespaceMedia, {"type": "PAUSE", "mediaSessionId": _sessionId});
  }

  void seekTo(Duration position) {
    _gCastRepository.sendMessage(CastSession.kNamespaceMedia, {
      "type": "SEEK",
      "mediaSessionId": _sessionId,
      "currentTime": position.inSeconds,
    });
  }

  void stop() {
    _castingVideo = false;
    _updateHardwareVolumeKeys();
    if (_customReceiver && _selectedPhoto != null) {
      _gCastRepository.sendMessage(photoNamespace, {'type': 'CLEAR_PHOTO'});
    } else {
      _gCastRepository.sendMessage(CastSession.kNamespaceMedia, {"type": "STOP", "mediaSessionId": _sessionId});
    }
    _mediaStatusPollingTimer?.cancel();

    currentAssetId = null;
    _currentSourceUrl = null;
    _clearPending();
    _selectedPhoto = null;
    _previousPhoto = null;
    _nextPhoto = null;
  }

  // 0x01 is display capability bitmask
  bool isDisplay(int ca) => (ca & 0x01) != 0;

  Future<List<(String, CastDestinationType, dynamic)>> getDevices() async {
    final dests = await _gCastRepository.listDestinations();

    return dests
        .map((device) => (device.extras["fn"] ?? "Google Cast", CastDestinationType.googleCast, device))
        .where((device) {
          final caString = device.$3.extras["ca"];
          final caNumber = int.tryParse(caString ?? "0") ?? 0;

          return isDisplay(caNumber);
        })
        .toList(growable: false);
  }
}
