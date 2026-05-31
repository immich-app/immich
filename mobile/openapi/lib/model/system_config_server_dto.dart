// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SystemConfigServerDto {
  const SystemConfigServerDto({
    required this.externalDomain,
    required this.loginPageMessage,
    required this.publicUsers,
  });

  /// External domain
  final String externalDomain;

  /// Login page message
  final String loginPageMessage;

  /// Public users
  final bool publicUsers;

  static SystemConfigServerDto? fromJson(dynamic value) {
    ApiCompat.upgrade<SystemConfigServerDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      externalDomain: json[r'externalDomain'] as String,
      loginPageMessage: json[r'loginPageMessage'] as String,
      publicUsers: json[r'publicUsers'] as bool,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'externalDomain'] = externalDomain;
    json[r'loginPageMessage'] = loginPageMessage;
    json[r'publicUsers'] = publicUsers;
    return json;
  }

  SystemConfigServerDto copyWith({String? externalDomain, String? loginPageMessage, bool? publicUsers}) {
    return .new(
      externalDomain: externalDomain ?? this.externalDomain,
      loginPageMessage: loginPageMessage ?? this.loginPageMessage,
      publicUsers: publicUsers ?? this.publicUsers,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is SystemConfigServerDto &&
            externalDomain == other.externalDomain &&
            loginPageMessage == other.loginPageMessage &&
            publicUsers == other.publicUsers);
  }

  @override
  int get hashCode {
    return Object.hashAll([externalDomain, loginPageMessage, publicUsers]);
  }

  @override
  String toString() =>
      'SystemConfigServerDto(externalDomain=$externalDomain, loginPageMessage=$loginPageMessage, publicUsers=$publicUsers)';
}
