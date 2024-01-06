import 'package:openapi/api.dart';

class ServerConfig {
  final int trashDays;
  final String oauthButtonText;
  final String externalDomain;

  const ServerConfig({
    required this.trashDays,
    required this.oauthButtonText,
    required this.externalDomain,
  });

  ServerConfig copyWith({
    int? trashDays,
    String? oauthButtonText,
    String? externalDomain,
  }) {
    return ServerConfig(
      trashDays: trashDays ?? this.trashDays,
      oauthButtonText: oauthButtonText ?? this.oauthButtonText,
      externalDomain: externalDomain ?? this.externalDomain,
    );
  }

  @override
  String toString() =>
      'ServerConfig(trashDays: $trashDays, oauthButtonText: $oauthButtonText, externalDomain: $externalDomain)';

  ServerConfig.fromDto(ServerConfigDto dto)
      : trashDays = dto.trashDays,
        oauthButtonText = dto.oauthButtonText,
        externalDomain = dto.externalDomain;

  @override
  bool operator ==(covariant ServerConfig other) {
    if (identical(this, other)) return true;

    return other.trashDays == trashDays &&
        other.oauthButtonText == oauthButtonText &&
        other.externalDomain == externalDomain;
  }

  @override
  int get hashCode =>
      trashDays.hashCode ^ oauthButtonText.hashCode ^ externalDomain.hashCode;
}
