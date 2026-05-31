// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class AuthStatusResponseDto {
  const AuthStatusResponseDto({
    this.expiresAt,
    required this.isElevated,
    required this.password,
    required this.pinCode,
    this.pinExpiresAt,
  });

  /// Session expiration date
  final String? expiresAt;

  /// Is elevated session
  final bool isElevated;

  /// Has password set
  final bool password;

  /// Has PIN code set
  final bool pinCode;

  /// PIN expiration date
  final String? pinExpiresAt;

  static const _undefined = Object();

  static AuthStatusResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<AuthStatusResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      expiresAt: (json[r'expiresAt'] as String?),
      isElevated: json[r'isElevated'] as bool,
      password: json[r'password'] as bool,
      pinCode: json[r'pinCode'] as bool,
      pinExpiresAt: (json[r'pinExpiresAt'] as String?),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (expiresAt != null) {
      json[r'expiresAt'] = expiresAt!;
    }
    json[r'isElevated'] = isElevated;
    json[r'password'] = password;
    json[r'pinCode'] = pinCode;
    if (pinExpiresAt != null) {
      json[r'pinExpiresAt'] = pinExpiresAt!;
    }
    return json;
  }

  AuthStatusResponseDto copyWith({
    Object? expiresAt = _undefined,
    bool? isElevated,
    bool? password,
    bool? pinCode,
    Object? pinExpiresAt = _undefined,
  }) {
    return .new(
      expiresAt: identical(expiresAt, _undefined) ? this.expiresAt : expiresAt as String?,
      isElevated: isElevated ?? this.isElevated,
      password: password ?? this.password,
      pinCode: pinCode ?? this.pinCode,
      pinExpiresAt: identical(pinExpiresAt, _undefined) ? this.pinExpiresAt : pinExpiresAt as String?,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is AuthStatusResponseDto &&
            expiresAt == other.expiresAt &&
            isElevated == other.isElevated &&
            password == other.password &&
            pinCode == other.pinCode &&
            pinExpiresAt == other.pinExpiresAt);
  }

  @override
  int get hashCode {
    return Object.hashAll([expiresAt, isElevated, password, pinCode, pinExpiresAt]);
  }

  @override
  String toString() =>
      'AuthStatusResponseDto(expiresAt=$expiresAt, isElevated=$isElevated, password=$password, pinCode=$pinCode, pinExpiresAt=$pinExpiresAt)';
}
