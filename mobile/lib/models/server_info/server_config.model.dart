import 'package:openapi/api.dart';

class ServerConfig {
  final int trashDays;
  final String oauthButtonText;
  final String externalDomain;
  final String uploadDomain;

  const ServerConfig({
    required this.trashDays,
    required this.oauthButtonText,
    required this.externalDomain,
    required this.uploadDomain,
  });

  ServerConfig copyWith({
    int? trashDays,
    String? oauthButtonText,
    String? externalDomain,
    String? uploadDomain,
  }) {
    return ServerConfig(
      trashDays: trashDays ?? this.trashDays,
      oauthButtonText: oauthButtonText ?? this.oauthButtonText,
      externalDomain: externalDomain ?? this.externalDomain,
      uploadDomain: uploadDomain ?? this.uploadDomain,
    );
  }

  @override
  String toString() =>
      'ServerConfig(trashDays: $trashDays, oauthButtonText: $oauthButtonText, externalDomain: $externalDomain, uploadDomain: $uploadDomain)';

  ServerConfig.fromDto(ServerConfigDto dto)
      : trashDays = dto.trashDays,
        oauthButtonText = dto.oauthButtonText,
        externalDomain = dto.externalDomain,
        uploadDomain = dto.uploadDomain;

  @override
  bool operator ==(covariant ServerConfig other) {
    if (identical(this, other)) return true;

    return other.trashDays == trashDays &&
        other.oauthButtonText == oauthButtonText &&
        other.externalDomain == externalDomain &&
        other.uploadDomain == uploadDomain;
  }

  @override
  int get hashCode =>
      trashDays.hashCode ^
      oauthButtonText.hashCode ^
      externalDomain.hashCode ^
      uploadDomain.hashCode;
}
