// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class LogoutResponseDto {
  const LogoutResponseDto({required this.redirectUri, required this.successful});

  /// Redirect URI
  final String redirectUri;

  /// Logout successful
  final bool successful;

  static LogoutResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<LogoutResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(redirectUri: json[r'redirectUri'] as String, successful: json[r'successful'] as bool);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'redirectUri'] = redirectUri;
    json[r'successful'] = successful;
    return json;
  }

  LogoutResponseDto copyWith({String? redirectUri, bool? successful}) {
    return .new(redirectUri: redirectUri ?? this.redirectUri, successful: successful ?? this.successful);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is LogoutResponseDto && redirectUri == other.redirectUri && successful == other.successful);
  }

  @override
  int get hashCode {
    return Object.hashAll([redirectUri, successful]);
  }

  @override
  String toString() => 'LogoutResponseDto(redirectUri=$redirectUri, successful=$successful)';
}
