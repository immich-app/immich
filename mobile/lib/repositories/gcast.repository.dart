import 'package:cast/device.dart';
import 'package:cast/session.dart';
import 'package:cast/session_manager.dart';
import 'package:cast/discovery_service.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

final gCastRepositoryProvider = Provider((_) {
  return GCastRepository();
});

class GCastRepository {
  CastSession? _castSession;

  void Function(CastSessionState)? onCastStatus;
  void Function(Map<String, dynamic>)? onCastMessage;

  Map<String, dynamic>? _receiverStatus;

  GCastRepository();

  Future<void> connect(CastDevice device) async {
    _castSession = await CastSessionManager().startSession(device);

    _castSession?.stateStream.listen((state) {
      onCastStatus?.call(state);
    });

    _castSession?.messageStream.listen((message) {
      onCastMessage?.call(message);
      if (message['type'] == 'RECEIVER_STATUS') {
        _receiverStatus = message;
      }
    });

    // open the default receiver
    sendMessage(CastSession.kNamespaceReceiver, {
      'type': 'LAUNCH',
      'appId': 'CC1AD845',
    });
  }

  Future<void> disconnect() async {
    final sessionID = getSessionId();

    sendMessage(CastSession.kNamespaceReceiver, {
      'type': "STOP",
      "sessionId": sessionID,
    });

    // wait 500ms to ensure the stop command is processed
    await Future.delayed(const Duration(milliseconds: 500));

    await _castSession?.close();
  }

  String? getSessionId() {
    if (_receiverStatus == null) {
      return null;
    }
    return _receiverStatus!['status']['applications'][0]['sessionId'];
  }

  void sendMessage(String namespace, Map<String, dynamic> message) {
    if (_castSession == null) {
      throw Exception("Cast session is not established");
    }

    _castSession!.sendMessage(namespace, message);
  }

  Future<List<CastDevice>> listDestinations() async {
    return await CastDiscoveryService()
        .search(timeout: const Duration(seconds: 3));
  }
}
