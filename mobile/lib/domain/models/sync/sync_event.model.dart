class SyncEvent {
  // dynamic
  final dynamic data;

  final String ack;

  SyncEvent({
    required this.data,
    required this.ack,
  });

  @override
  String toString() => 'SyncEvent(data: $data, ack: $ack)';
}
