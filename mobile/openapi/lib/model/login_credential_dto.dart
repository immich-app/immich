// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class LoginCredentialDto {
  const LoginCredentialDto({required this.email, required this.password});

  /// User email
  final String email;

  /// User password
  final String password;

  static LoginCredentialDto? fromJson(dynamic value) {
    ApiCompat.upgrade<LoginCredentialDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(email: json[r'email'] as String, password: json[r'password'] as String);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'email'] = email;
    json[r'password'] = password;
    return json;
  }

  LoginCredentialDto copyWith({String? email, String? password}) {
    return .new(email: email ?? this.email, password: password ?? this.password);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is LoginCredentialDto && email == other.email && password == other.password);
  }

  @override
  int get hashCode {
    return Object.hashAll([email, password]);
  }

  @override
  String toString() => 'LoginCredentialDto(email=$email, password=$password)';
}
