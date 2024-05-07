import 'package:openapi/api.dart';

class ServerConfig {
  final int trashDays;
  final String oauthButtonText;
  final String externalDomain;
  final String uploadEndpoint;

  const ServerConfig({
    required this.trashDays,
    required this.oauthButtonText,
    required this.externalDomain,
    required this.uploadEndpoint,
  });

  ServerConfig copyWith({
    int? trashDays,
    String? oauthButtonText,
    String? externalDomain,
    String? uploadEndpoint,
  }) {
    return ServerConfig(
      trashDays: trashDays ?? this.trashDays,
      oauthButtonText: oauthButtonText ?? this.oauthButtonText,
      externalDomain: externalDomain ?? this.externalDomain,
      uploadEndpoint: uploadEndpoint ?? this.uploadEndpoint,
    );
  }

  @override
  String toString() =>
      'ServerConfig(trashDays: $trashDays, oauthButtonText: $oauthButtonText, externalDomain: $externalDomain, uploadEndpoint: $uploadEndpoint)';

  ServerConfig.fromDto(ServerConfigDto dto)
      : trashDays = dto.trashDays,
        oauthButtonText = dto.oauthButtonText,
        externalDomain = dto.externalDomain,
        uploadEndpoint = dto.uploadEndpoint;

  @override
  bool operator ==(covariant ServerConfig other) {
    if (identical(this, other)) return true;

    return other.trashDays == trashDays &&
        other.oauthButtonText == oauthButtonText &&
        other.externalDomain == externalDomain &&
        other.uploadEndpoint == uploadEndpoint;
  }

  @override
  int get hashCode =>
      trashDays.hashCode ^
      oauthButtonText.hashCode ^
      externalDomain.hashCode ^
      uploadEndpoint.hashCode;
}
