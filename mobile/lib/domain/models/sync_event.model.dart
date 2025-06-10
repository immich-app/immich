import 'package:openapi/api.dart';

class SyncEvent {
  final SyncEntityType type;
  final Object data;
  final String ack;

  const SyncEvent({required this.type, required this.data, required this.ack});

  @override
  String toString() => 'SyncEvent(type: $type, data: $data, ack: $ack)';
}
