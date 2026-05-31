// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class ServerConfigDto {
  const ServerConfigDto({
    required this.externalDomain,
    required this.isInitialized,
    required this.isOnboarded,
    required this.loginPageMessage,
    required this.maintenanceMode,
    required this.mapDarkStyleUrl,
    required this.mapLightStyleUrl,
    required this.oauthButtonText,
    required this.publicUsers,
    required this.trashDays,
    required this.userDeleteDelay,
  });

  /// External domain URL
  final String externalDomain;

  /// Whether the server has been initialized
  final bool isInitialized;

  /// Whether the admin has completed onboarding
  final bool isOnboarded;

  /// Login page message
  final String loginPageMessage;

  /// Whether maintenance mode is active
  final bool maintenanceMode;

  /// Map dark style URL
  final String mapDarkStyleUrl;

  /// Map light style URL
  final String mapLightStyleUrl;

  /// OAuth button text
  final String oauthButtonText;

  /// Whether public user registration is enabled
  final bool publicUsers;

  /// Number of days before trashed assets are permanently deleted
  final int trashDays;

  /// Delay in days before deleted users are permanently removed
  final int userDeleteDelay;

  static ServerConfigDto? fromJson(dynamic value) {
    ApiCompat.upgrade<ServerConfigDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      externalDomain: json[r'externalDomain'] as String,
      isInitialized: json[r'isInitialized'] as bool,
      isOnboarded: json[r'isOnboarded'] as bool,
      loginPageMessage: json[r'loginPageMessage'] as String,
      maintenanceMode: json[r'maintenanceMode'] as bool,
      mapDarkStyleUrl: json[r'mapDarkStyleUrl'] as String,
      mapLightStyleUrl: json[r'mapLightStyleUrl'] as String,
      oauthButtonText: json[r'oauthButtonText'] as String,
      publicUsers: json[r'publicUsers'] as bool,
      trashDays: json[r'trashDays'] as int,
      userDeleteDelay: json[r'userDeleteDelay'] as int,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'externalDomain'] = externalDomain;
    json[r'isInitialized'] = isInitialized;
    json[r'isOnboarded'] = isOnboarded;
    json[r'loginPageMessage'] = loginPageMessage;
    json[r'maintenanceMode'] = maintenanceMode;
    json[r'mapDarkStyleUrl'] = mapDarkStyleUrl;
    json[r'mapLightStyleUrl'] = mapLightStyleUrl;
    json[r'oauthButtonText'] = oauthButtonText;
    json[r'publicUsers'] = publicUsers;
    json[r'trashDays'] = trashDays;
    json[r'userDeleteDelay'] = userDeleteDelay;
    return json;
  }

  ServerConfigDto copyWith({
    String? externalDomain,
    bool? isInitialized,
    bool? isOnboarded,
    String? loginPageMessage,
    bool? maintenanceMode,
    String? mapDarkStyleUrl,
    String? mapLightStyleUrl,
    String? oauthButtonText,
    bool? publicUsers,
    int? trashDays,
    int? userDeleteDelay,
  }) {
    return .new(
      externalDomain: externalDomain ?? this.externalDomain,
      isInitialized: isInitialized ?? this.isInitialized,
      isOnboarded: isOnboarded ?? this.isOnboarded,
      loginPageMessage: loginPageMessage ?? this.loginPageMessage,
      maintenanceMode: maintenanceMode ?? this.maintenanceMode,
      mapDarkStyleUrl: mapDarkStyleUrl ?? this.mapDarkStyleUrl,
      mapLightStyleUrl: mapLightStyleUrl ?? this.mapLightStyleUrl,
      oauthButtonText: oauthButtonText ?? this.oauthButtonText,
      publicUsers: publicUsers ?? this.publicUsers,
      trashDays: trashDays ?? this.trashDays,
      userDeleteDelay: userDeleteDelay ?? this.userDeleteDelay,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is ServerConfigDto &&
            externalDomain == other.externalDomain &&
            isInitialized == other.isInitialized &&
            isOnboarded == other.isOnboarded &&
            loginPageMessage == other.loginPageMessage &&
            maintenanceMode == other.maintenanceMode &&
            mapDarkStyleUrl == other.mapDarkStyleUrl &&
            mapLightStyleUrl == other.mapLightStyleUrl &&
            oauthButtonText == other.oauthButtonText &&
            publicUsers == other.publicUsers &&
            trashDays == other.trashDays &&
            userDeleteDelay == other.userDeleteDelay);
  }

  @override
  int get hashCode {
    return Object.hashAll([
      externalDomain,
      isInitialized,
      isOnboarded,
      loginPageMessage,
      maintenanceMode,
      mapDarkStyleUrl,
      mapLightStyleUrl,
      oauthButtonText,
      publicUsers,
      trashDays,
      userDeleteDelay,
    ]);
  }

  @override
  String toString() =>
      'ServerConfigDto(externalDomain=$externalDomain, isInitialized=$isInitialized, isOnboarded=$isOnboarded, loginPageMessage=$loginPageMessage, maintenanceMode=$maintenanceMode, mapDarkStyleUrl=$mapDarkStyleUrl, mapLightStyleUrl=$mapLightStyleUrl, oauthButtonText=$oauthButtonText, publicUsers=$publicUsers, trashDays=$trashDays, userDeleteDelay=$userDeleteDelay)';
}
