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
  SyncEvent({
    required this.type,
    required this.action,
    required this.data,
  });

  SyncEvent copyWith({
    SyncStreamDtoTypesEnum? type,
    SyncAction? action,
    dynamic data,
  }) {
    return SyncEvent(
      type: type ?? this.type,
      action: action ?? this.action,
      data: data ?? this.data,
    );
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'type': type,
      'action': action,
      'data': data,
    };
  }

  factory SyncEvent.fromMap(Map<String, dynamic> map) {
    return SyncEvent(
      type: SyncStreamDtoTypesEnum.values[map['type'] as int],
      action: SyncAction.values[map['action'] as int],
      data: map['data'] as dynamic,
    );
  }

  String toJson() => json.encode(toMap());

  factory SyncEvent.fromJson(String source) =>
      SyncEvent.fromMap(json.decode(source) as Map<String, dynamic>);

  @override
  String toString() => 'SyncEvent(type: $type, action: $action, data: $data)';

  @override
  bool operator ==(covariant SyncEvent other) {
    if (identical(this, other)) return true;

    return other.type == type && other.action == action && other.data == data;
  }

  @override
  int get hashCode => type.hashCode ^ action.hashCode ^ data.hashCode;
}
