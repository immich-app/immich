import 'package:openapi/api.dart';

class ServerFeatures {
  final bool trash;
  final bool map;
  final bool oauthEnabled;
  final bool passwordLogin;

  const ServerFeatures({
    required this.trash,
    required this.map,
    required this.oauthEnabled,
    required this.passwordLogin,
  });

  ServerFeatures copyWith({
    bool? trash,
    bool? map,
    bool? oauthEnabled,
    bool? passwordLogin,
  }) {
    return ServerFeatures(
      trash: trash ?? this.trash,
      map: map ?? this.map,
      oauthEnabled: oauthEnabled ?? this.oauthEnabled,
      passwordLogin: passwordLogin ?? this.passwordLogin,
    );
  }

  @override
  String toString() {
    return 'ServerFeatures(trash: $trash, map: $map, oauthEnabled: $oauthEnabled, passwordLogin: $passwordLogin)';
  }

  ServerFeatures.fromDto(ServerFeaturesDto dto)
      : trash = dto.trash,
        map = dto.map,
        oauthEnabled = dto.oauth,
        passwordLogin = dto.passwordLogin;

  @override
  bool operator ==(covariant ServerFeatures other) {
    if (identical(this, other)) return true;

    return other.trash == trash &&
        other.map == map &&
        other.oauthEnabled == oauthEnabled &&
        other.passwordLogin == passwordLogin;
  }

  @override
  int get hashCode {
    return trash.hashCode ^
        map.hashCode ^
        oauthEnabled.hashCode ^
        passwordLogin.hashCode;
  }
}
