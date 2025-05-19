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

  GCastRepository();

  Future<void> connect(CastDevice device) async {
    print("Connecting to ${device.name}");
    _castSession = await CastSessionManager().startSession(device);

    _castSession?.stateStream.listen((state) {
      onCastStatus?.call(state);
    });

    _castSession?.messageStream.listen((message) {
      onCastMessage?.call(message);
    });

    // open the default receiver
    sendMessage(CastSession.kNamespaceReceiver, {
      'type': 'LAUNCH',
      'appId': 'CC1AD845',
    });

    print("Connected to ${device.name}");
  }

  Future<void> disconnect() async {
    await _castSession?.close();
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
