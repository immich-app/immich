// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'dart:convert';

enum ImmichLogLevel {
  info,
  error,
}

class ImmichLog {
  final String id;
  final String message;
  // enum
  final ImmichLogLevel level;
  final DateTime createdAt;
  ImmichLog({
    required this.id,
    required this.message,
    required this.level,
    required this.createdAt,
  });

  ImmichLog copyWith({
    String? id,
    String? message,
    ImmichLogLevel? level,
    DateTime? createdAt,
  }) {
    return ImmichLog(
      id: id ?? this.id,
      message: message ?? this.message,
      level: level ?? this.level,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'id': id,
      'message': message,
      'level': level.index,
      'createdAt': createdAt.millisecondsSinceEpoch,
    };
  }

  factory ImmichLog.fromMap(Map<String, dynamic> map) {
    return ImmichLog(
      id: map['id'] as String,
      message: map['message'] as String,
      level: ImmichLogLevel.values[map['level'] as int],
      createdAt: DateTime.fromMillisecondsSinceEpoch(map['createdAt'] as int),
    );
  }

  String toJson() => json.encode(toMap());

  factory ImmichLog.fromJson(String source) =>
      ImmichLog.fromMap(json.decode(source) as Map<String, dynamic>);

  @override
  String toString() {
    return 'ImmichLog(id: $id, message: $message, level: $level, createdAt: $createdAt)';
  }

  @override
  bool operator ==(covariant ImmichLog other) {
    if (identical(this, other)) return true;

    return other.id == id &&
        other.message == message &&
        other.level == level &&
        other.createdAt == createdAt;
  }

  @override
  int get hashCode {
    return id.hashCode ^ message.hashCode ^ level.hashCode ^ createdAt.hashCode;
  }
}
