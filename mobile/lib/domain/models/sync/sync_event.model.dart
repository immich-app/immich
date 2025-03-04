// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'dart:convert';

class SyncEvent {
  // dynamic
  final dynamic data;

  final String ack;

  SyncEvent({
    required this.data,
    required this.ack,
  });

  SyncEvent copyWith({
    dynamic data,
    String? ack,
  }) {
    return SyncEvent(
      data: data ?? this.data,
      ack: ack ?? this.ack,
    );
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'data': data,
      'ack': ack,
    };
  }

  factory SyncEvent.fromMap(Map<String, dynamic> map) {
    return SyncEvent(
      data: map['data'] as dynamic,
      ack: map['ack'] as String,
    );
  }

  String toJson() => json.encode(toMap());

  factory SyncEvent.fromJson(String source) =>
      SyncEvent.fromMap(json.decode(source) as Map<String, dynamic>);

  @override
  String toString() => 'SyncEvent(data: $data, ack: $ack)';

  @override
  bool operator ==(covariant SyncEvent other) {
    if (identical(this, other)) return true;

    return other.data == data && other.ack == ack;
  }

  @override
  int get hashCode => data.hashCode ^ ack.hashCode;
}
