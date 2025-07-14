import 'package:openapi/api.dart';

class ServerFeatures {
  final bool trash;
  final bool map;
  final bool oauthEnabled;
  final bool passwordLogin;
  final String streamingType;

  const ServerFeatures({
    required this.trash,
    required this.map,
    required this.oauthEnabled,
    required this.passwordLogin,
    required this.streamingType
  });

  ServerFeatures copyWith({
    bool? trash,
    bool? map,
    bool? oauthEnabled,
    bool? passwordLogin,
    String? streamingType
  }) {
    return ServerFeatures(
        trash: trash ?? this.trash,
        map: map ?? this.map,
        oauthEnabled: oauthEnabled ?? this.oauthEnabled,
        passwordLogin: passwordLogin ?? this.passwordLogin,
        streamingType: streamingType ?? this.streamingType
    );
  }

  @override
  String toString() {
    return 'ServerFeatures(trash: $trash, map: $map, oauthEnabled: $oauthEnabled, passwordLogin: $passwordLogin, streamingType: $streamingType)';
  }

  ServerFeatures.fromDto(ServerFeaturesDto dto)
      : trash = dto.trash,
        map = dto.map,
        oauthEnabled = dto.oauth,
        passwordLogin = dto.passwordLogin,
        streamingType = dto.streaming;

  @override
  bool operator ==(covariant ServerFeatures other) {
    if (identical(this, other)) return true;

    return other.trash == trash &&
        other.map == map &&
        other.oauthEnabled == oauthEnabled &&
        other.streamingType == streamingType &&
        other.passwordLogin == passwordLogin;
  }

  @override
  int get hashCode {
    return trash.hashCode ^
    map.hashCode ^
    oauthEnabled.hashCode ^
    passwordLogin.hashCode ^
    streamingType.hashCode;
  }
}
