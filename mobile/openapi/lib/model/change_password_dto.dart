// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class ChangePasswordDto {
  const ChangePasswordDto({
    this.invalidateSessions = const Optional.absent(),
    required this.newPassword,
    required this.password,
  });

  /// Invalidate all other sessions
  final Optional<bool> invalidateSessions;

  /// New password (min 8 characters)
  final String newPassword;

  /// Current password
  final String password;

  static ChangePasswordDto? fromJson(dynamic value) {
    ApiCompat.upgrade<ChangePasswordDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      invalidateSessions: json.containsKey(r'invalidateSessions')
          ? Optional.present(json[r'invalidateSessions'] as bool)
          : const Optional.absent(),
      newPassword: json[r'newPassword'] as String,
      password: json[r'password'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (invalidateSessions case Present(:final value)) {
      json[r'invalidateSessions'] = value;
    }
    json[r'newPassword'] = newPassword;
    json[r'password'] = password;
    return json;
  }

  ChangePasswordDto copyWith({Optional<bool>? invalidateSessions, String? newPassword, String? password}) {
    return .new(
      invalidateSessions: invalidateSessions ?? this.invalidateSessions,
      newPassword: newPassword ?? this.newPassword,
      password: password ?? this.password,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is ChangePasswordDto &&
            invalidateSessions == other.invalidateSessions &&
            newPassword == other.newPassword &&
            password == other.password);
  }

  @override
  int get hashCode {
    return Object.hashAll([invalidateSessions, newPassword, password]);
  }

  @override
  String toString() =>
      'ChangePasswordDto(invalidateSessions=$invalidateSessions, newPassword=$newPassword, password=$password)';
}
