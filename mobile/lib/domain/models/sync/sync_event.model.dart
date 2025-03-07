class SyncEvent {
  // ignore: avoid-dynamic
  final dynamic data;
  final String ack;

  const SyncEvent({required this.data, required this.ack});

  @override
  String toString() => 'SyncEvent(data: $data, ack: $ack)';
}
