// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'dart:convert';

enum SyncTypeEnum { user, userDelete }

class SyncEvent {
  // enum
  final SyncTypeEnum syncType;

  // dynamic
  final dynamic data;

  final String ack;

  SyncEvent({
    required this.syncType,
    required this.data,
    required this.ack,
  });

  SyncEvent copyWith({
    SyncTypeEnum? syncType,
    dynamic data,
    String? ack,
  }) {
    return SyncEvent(
      syncType: syncType ?? this.syncType,
      data: data ?? this.data,
      ack: ack ?? this.ack,
    );
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'syncType': syncType.index,
      'data': data,
      'ack': ack,
    };
  }

  factory SyncEvent.fromMap(Map<String, dynamic> map) {
    return SyncEvent(
      syncType: SyncTypeEnum.values[map['syncType'] as int],
      data: map['data'] as dynamic,
      ack: map['ack'] as String,
    );
  }

  String toJson() => json.encode(toMap());

  factory SyncEvent.fromJson(String source) =>
      SyncEvent.fromMap(json.decode(source) as Map<String, dynamic>);

  @override
  String toString() => 'SyncEvent(syncType: $syncType, data: $data, ack: $ack)';

  @override
  bool operator ==(covariant SyncEvent other) {
    if (identical(this, other)) return true;

    return other.syncType == syncType && other.data == data && other.ack == ack;
  }

  @override
  int get hashCode => syncType.hashCode ^ data.hashCode ^ ack.hashCode;
}
