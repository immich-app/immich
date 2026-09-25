import 'dart:async';

import 'package:cast/device.dart';
import 'package:cast/discovery_service.dart';
import 'package:cast/session.dart';
import 'package:cast/session_manager.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

final gCastRepositoryProvider = Provider((_) {
  return GCastRepository();
});

class GCastRepository {
  static const defaultReceiverAppId = 'CC1AD845';
  CastSession? _castSession;
  String? _activeTransportId;
  String? _activeAppSessionId;

  void Function(CastSessionState)? onCastStatus;
  void Function(Map<String, dynamic>)? onCastMessage;

  GCastRepository();

  Future<void> connect(CastDevice device, String customReceiverAppId) async {
    _castSession = await CastSessionManager().startSession(device);
    _activeTransportId = null;
    _activeAppSessionId = null;
    final appId = customReceiverAppId.isEmpty ? defaultReceiverAppId : customReceiverAppId;
    final launched = Completer<void>();

    _castSession?.stateStream.listen((state) {
      onCastStatus?.call(state);
    });

    _castSession?.messageStream.listen((message) {
      onCastMessage?.call(message);
      if (message['type'] == 'LAUNCH_ERROR' && !launched.isCompleted) {
        launched.completeError(StateError('Cast receiver failed to launch: ${message['reason']}'));
      }
      if (message['type'] == 'RECEIVER_STATUS') {
        final applications = message['status']?['applications'];
        if (applications is List) {
          for (final app in applications) {
            if (app is Map && app['appId'] == appId && app['transportId'] is String) {
              final transportId = app['transportId'] as String;
              _activeAppSessionId = app['sessionId'] as String?;
              if (_activeTransportId != transportId) {
                _activeTransportId = transportId;
                // The cast package keeps the first app transport it sees. A
                // receiver switch needs a new virtual connection to this app.
                _castSession?.socket.sendMessage(
                    CastSession.kNamespaceConnection, _castSession!.sessionId, transportId, {'type': 'CONNECT'});
              }
              if (!launched.isCompleted) {
                launched.complete();
              }
              break;
            }
          }
        }
      }
    });

    sendMessage(CastSession.kNamespaceReceiver, {'type': 'LAUNCH', 'appId': appId});
    try {
      await launched.future.timeout(const Duration(seconds: 10));
    } catch (_) {
      await _castSession?.close();
      _castSession = null;
      _activeTransportId = null;
      _activeAppSessionId = null;
      rethrow;
    }
  }

  Future<void> disconnect() async {
    final sessionID = getSessionId();

    sendMessage(CastSession.kNamespaceReceiver, {'type': "STOP", "sessionId": sessionID});

    // wait 500ms to ensure the stop command is processed
    await Future.delayed(const Duration(milliseconds: 500));

    await _castSession?.close();
    _castSession = null;
    _activeTransportId = null;
    _activeAppSessionId = null;
  }

  String? getSessionId() => _activeAppSessionId;

  void sendMessage(String namespace, Map<String, dynamic> message) {
    final session = _castSession;
    if (session == null) {
      throw Exception("Cast session is not established");
    }

    final destinationId = namespace == CastSession.kNamespaceReceiver ? 'receiver-0' : _activeTransportId;
    if (destinationId == null) {
      throw StateError('Cast receiver is not ready');
    }
    session.socket.sendMessage(namespace, session.sessionId, destinationId, message);
  }

  Future<List<CastDevice>> listDestinations() async {
    return await CastDiscoveryService().search(timeout: const Duration(seconds: 3));
  }
}
