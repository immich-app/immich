import 'dart:convert';

class UserInfo {
  final String id;
  final String email;
  final String createdAt;

  UserInfo({
    required this.id,
    required this.email,
    required this.createdAt,
  });

  UserInfo copyWith({
    String? id,
    String? email,
    String? createdAt,
  }) {
    return UserInfo(
      id: id ?? this.id,
      email: email ?? this.email,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  Map<String, dynamic> toMap() {
    final result = <String, dynamic>{};

    result.addAll({'id': id});
    result.addAll({'email': email});
    result.addAll({'createdAt': createdAt});

    return result;
  }

  factory UserInfo.fromMap(Map<String, dynamic> map) {
    return UserInfo(
      id: map['id'] ?? '',
      email: map['email'] ?? '',
      createdAt: map['createdAt'] ?? '',
    );
  }

  String toJson() => json.encode(toMap());

  factory UserInfo.fromJson(String source) => UserInfo.fromMap(json.decode(source));

  @override
  String toString() => 'UserInfo(id: $id, email: $email, createdAt: $createdAt)';

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is UserInfo && other.id == id && other.email == email && other.createdAt == createdAt;
  }

  @override
  int get hashCode => id.hashCode ^ email.hashCode ^ createdAt.hashCode;
}
