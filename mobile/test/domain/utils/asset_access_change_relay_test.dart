import 'dart:isolate';

import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/events.model.dart';
import 'package:immich_mobile/domain/utils/asset_access_change_relay.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';

void main() {
  test('forwards worker privacy changes to foreground viewers before closing the relay', () async {
    final relay = AssetAccessChangeRelay();
    final notification = EventStream.shared.where<AssetAccessChangedEvent>().first;
    final sendPort = relay.sendPort;

    await Isolate.run(() => sendPort.send(null));
    await relay.close();

    expect(await notification.timeout(const Duration(seconds: 2)), isA<AssetAccessChangedEvent>());
  });

  test('releases the receive port when a sync task ends', () async {
    final relay = AssetAccessChangeRelay();
    final events = <AssetAccessChangedEvent>[];
    final subscription = EventStream.shared.where<AssetAccessChangedEvent>().listen(events.add);
    addTearDown(subscription.cancel);
    final sendPort = relay.sendPort;
    await relay.close();

    sendPort.send(null);
    await Future<void>.delayed(Duration.zero);

    expect(events, isEmpty);
  });
}
