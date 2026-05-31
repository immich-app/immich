// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SignUpDto {
  const SignUpDto({required this.email, required this.name, required this.password});

  /// User email
  final String email;

  /// User name
  final String name;

  /// User password
  final String password;

  static SignUpDto? fromJson(dynamic value) {
    ApiCompat.upgrade<SignUpDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(email: json[r'email'] as String, name: json[r'name'] as String, password: json[r'password'] as String);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'email'] = email;
    json[r'name'] = name;
    json[r'password'] = password;
    return json;
  }

  SignUpDto copyWith({String? email, String? name, String? password}) {
    return .new(email: email ?? this.email, name: name ?? this.name, password: password ?? this.password);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is SignUpDto && email == other.email && name == other.name && password == other.password);
  }

  @override
  int get hashCode {
    return Object.hashAll([email, name, password]);
  }

  @override
  String toString() => 'SignUpDto(email=$email, name=$name, password=$password)';
}
