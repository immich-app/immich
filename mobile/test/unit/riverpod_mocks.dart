import 'package:immich_mobile/models/server_info/server_version.model.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/providers/websocket.provider.dart';

import '../domain/service.mock.dart';

class FakeServerInfoNotifier extends ServerInfoNotifier {
  FakeServerInfoNotifier({
    bool trashEnabled = true,
    ServerVersion version = const ServerVersion(major: 2, minor: 6, patch: 0),
  }) : super(MockServerInfoService()) {
    state = state.copyWith(
      serverVersion: version,
      serverFeatures: state.serverFeatures.copyWith(trash: trashEnabled),
    );
  }
}

class FakeWebsocketNotifier extends WebsocketNotifier {
  FakeWebsocketNotifier(super.ref);

  final List<String> waitedEvents = [];

  @override
  Future<void> waitForEvent(String event, bool Function(dynamic)? predicate, Duration timeout) {
    waitedEvents.add(event);
    return Future.value();
  }
}
