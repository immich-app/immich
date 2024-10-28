// ignore_for_file: public_member_api_docs, sort_constructors_first

import 'dart:convert';

import 'package:openapi/api.dart';

class SyncEvent {
  // enum
  final SyncStreamDtoTypesEnum type;

  // enum
  final SyncAction action;

  // dynamic
  final dynamic data;

  // Acknowledge info
  final String id;
  final String timestamp;

  SyncEvent({
    required this.type,
    required this.action,
    required this.data,
    required this.id,
    required this.timestamp,
  });

  SyncEvent copyWith({
    SyncStreamDtoTypesEnum? type,
    SyncAction? action,
    dynamic data,
    String? id,
    String? timestamp,
  }) {
    return SyncEvent(
      type: type ?? this.type,
      action: action ?? this.action,
      data: data ?? this.data,
      id: id ?? this.id,
      timestamp: timestamp ?? this.timestamp,
    );
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'type': type,
      'action': action,
      'data': data,
      'id': id,
      'timestamp': timestamp,
    };
  }

  factory SyncEvent.fromMap(Map<String, dynamic> map) {
    return SyncEvent(
      type: SyncStreamDtoTypesEnum.values[map['type'] as int],
      action: SyncAction.values[map['action'] as int],
      data: map['data'] as dynamic,
      id: map['id'] as String,
      timestamp: map['timestamp'] as String,
    );
  }

  String toJson() => json.encode(toMap());

  factory SyncEvent.fromJson(String source) =>
      SyncEvent.fromMap(json.decode(source) as Map<String, dynamic>);

  @override
  String toString() {
    return 'SyncEvent(type: $type, action: $action, data: $data, id: $id, timestamp: $timestamp)';
  }

  @override
  bool operator ==(covariant SyncEvent other) {
    if (identical(this, other)) return true;

    return other.type == type &&
        other.action == action &&
        other.data == data &&
        other.id == id &&
        other.timestamp == timestamp;
  }

  @override
  int get hashCode {
    return type.hashCode ^
        action.hashCode ^
        data.hashCode ^
        id.hashCode ^
        timestamp.hashCode;
  }
}
