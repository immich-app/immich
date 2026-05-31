// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class OAuthBackchannelLogoutDto {
  const OAuthBackchannelLogoutDto({required this.logoutToken});

  /// OAuth logout token
  final String logoutToken;

  static OAuthBackchannelLogoutDto? fromJson(dynamic value) {
    ApiCompat.upgrade<OAuthBackchannelLogoutDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(logoutToken: json[r'logout_token'] as String);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'logout_token'] = logoutToken;
    return json;
  }

  OAuthBackchannelLogoutDto copyWith({String? logoutToken}) {
    return .new(logoutToken: logoutToken ?? this.logoutToken);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is OAuthBackchannelLogoutDto && logoutToken == other.logoutToken);
  }

  @override
  int get hashCode {
    return Object.hashAll([logoutToken]);
  }

  @override
  String toString() => 'OAuthBackchannelLogoutDto(logoutToken=$logoutToken)';
}
