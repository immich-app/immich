import 'package:openapi/openapi.dart';

class ServerFeatures {
  final bool hasPasswordLogin;
  final bool hasOAuthLogin;

  const ServerFeatures({
    required this.hasPasswordLogin,
    required this.hasOAuthLogin,
  });

  ServerFeatures copyWith({bool? hasPasswordLogin, bool? hasOAuthLogin}) {
    return ServerFeatures(
      hasPasswordLogin: hasPasswordLogin ?? this.hasPasswordLogin,
      hasOAuthLogin: hasOAuthLogin ?? this.hasOAuthLogin,
    );
  }

  factory ServerFeatures.fromDto(ServerFeaturesDto dto) => ServerFeatures(
        hasPasswordLogin: dto.passwordLogin,
        hasOAuthLogin: dto.oauth,
      );

  const ServerFeatures.reset()
      : hasPasswordLogin = true,
        hasOAuthLogin = false;

  @override
  String toString() =>
      'ServerFeatures(hasPasswordLogin: $hasPasswordLogin, hasOAuthLogin: $hasOAuthLogin)';

  @override
  bool operator ==(covariant ServerFeatures other) {
    if (identical(this, other)) return true;

    return other.hasPasswordLogin == hasPasswordLogin &&
        other.hasOAuthLogin == hasOAuthLogin;
  }

  @override
  int get hashCode => hasPasswordLogin.hashCode ^ hasOAuthLogin.hashCode;
}
