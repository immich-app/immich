import 'package:openapi/openapi.dart';

class ServerConfig {
  final String? oauthButtonText;

  const ServerConfig({this.oauthButtonText});

  ServerConfig copyWith({String? oauthButtonText}) {
    return ServerConfig(
      oauthButtonText: oauthButtonText ?? this.oauthButtonText,
    );
  }

  factory ServerConfig.fromDto(ServerConfigDto dto) => ServerConfig(
        oauthButtonText:
            dto.oauthButtonText.isEmpty ? null : dto.oauthButtonText,
      );

  const ServerConfig.reset() : oauthButtonText = null;

  @override
  String toString() =>
      'ServerConfig(oauthButtonText: ${oauthButtonText ?? '<NULL>'})';

  @override
  bool operator ==(covariant ServerConfig other) {
    if (identical(this, other)) return true;

    return other.oauthButtonText == oauthButtonText;
  }

  @override
  int get hashCode => oauthButtonText.hashCode;
}
