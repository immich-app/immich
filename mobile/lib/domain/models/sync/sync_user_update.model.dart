// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'dart:convert';

class SyncUserUpdateResponse {
  final String id;

  final String name;

  final String email;

  final DateTime? deletedAt;

  SyncUserUpdateResponse({
    required this.id,
    required this.name,
    required this.email,
    required this.deletedAt,
  });

  SyncUserUpdateResponse copyWith({
    String? id,
    String? name,
    String? email,
    DateTime? deletedAt,
  }) {
    return SyncUserUpdateResponse(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      deletedAt: deletedAt ?? this.deletedAt,
    );
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'id': id,
      'name': name,
      'email': email,
      'deletedAt': deletedAt,
    };
  }

  factory SyncUserUpdateResponse.fromMap(Map<String, dynamic> map) {
    return SyncUserUpdateResponse(
      id: map['id'] as String,
      name: map['name'] as String,
      email: map['email'] as String,
      deletedAt:
          map['deletedAt'] != null ? DateTime.parse(map['deletedAt']) : null,
    );
  }

  String toJson() => json.encode(toMap());

  factory SyncUserUpdateResponse.fromJson(String source) =>
      SyncUserUpdateResponse.fromMap(
        json.decode(source) as Map<String, dynamic>,
      );

  @override
  String toString() {
    return 'SyncUserResponse(id: $id, name: $name, email: $email, deletedAt: $deletedAt)';
  }

  @override
  bool operator ==(covariant SyncUserUpdateResponse other) {
    if (identical(this, other)) return true;

    return other.id == id &&
        other.name == name &&
        other.email == email &&
        other.deletedAt == deletedAt;
  }

  @override
  int get hashCode {
    return id.hashCode ^ name.hashCode ^ email.hashCode ^ deletedAt.hashCode;
  }
}
