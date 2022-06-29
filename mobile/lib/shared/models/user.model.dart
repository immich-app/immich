import 'dart:convert';

class User {
  final String id;
  final String email;
  final String createdAt;
  final String firstName;
  final String lastName;

  User({
    required this.id,
    required this.email,
    required this.createdAt,
    required this.firstName,
    required this.lastName,
  });

  User copyWith({
    String? id,
    String? email,
    String? createdAt,
    String? firstName,
    String? lastName,
  }) {
    return User(
      id: id ?? this.id,
      email: email ?? this.email,
      createdAt: createdAt ?? this.createdAt,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
    );
  }

  Map<String, dynamic> toMap() {
    final result = <String, dynamic>{};

    result.addAll({'id': id});
    result.addAll({'email': email});
    result.addAll({'createdAt': createdAt});

    return result;
  }

  factory User.fromMap(Map<String, dynamic> map) {
    return User(
      id: map['id'] ?? '',
      email: map['email'] ?? '',
      createdAt: map['createdAt'] ?? '',
      firstName: map['firstName'] ?? '',
      lastName: map['lastName'] ?? '',
    );
  }

  String toJson() => json.encode(toMap());

  factory User.fromJson(String source) => User.fromMap(json.decode(source));

  @override
  String toString() =>
      'UserInfo(id: $id, email: $email, createdAt: $createdAt)';

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is User &&
        other.id == id &&
        other.email == email &&
        other.createdAt == createdAt &&
        other.firstName == firstName &&
        other.lastName == lastName;
  }

  @override
  int get hashCode => id.hashCode ^ email.hashCode ^ createdAt.hashCode;
}
