import 'dart:async';
import 'dart:isolate';

import 'package:immich_mobile/domain/models/events.model.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';

class AssetAccessChangeRelay {
  final _port = ReceivePort();

  AssetAccessChangeRelay() {
    _port.listen((_) => EventStream.shared.emit(const AssetAccessChangedEvent()));
  }

  SendPort get sendPort => _port.sendPort;

  Future<void> close() async {
    await Future<void>.delayed(Duration.zero);
    _port.close();
  }
}
