import 'package:openapi/api.dart';

class ServerConfig {
  final int trashDays;
  final String externalDomain;

  const ServerConfig({
    required this.trashDays,
    required this.externalDomain,
  });

  ServerConfig copyWith({
    int? trashDays,
    String? externalDomain,
  }) {
    return ServerConfig(
      trashDays: trashDays ?? this.trashDays,
      externalDomain: externalDomain ?? this.externalDomain,
    );
  }

  @override
  String toString() =>
      'ServerConfig(trashDays: $trashDays, externalDomain: $externalDomain)';

  ServerConfig.fromDto(ServerConfigDto dto)
      : trashDays = dto.trashDays,
        externalDomain = dto.externalDomain;

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is ServerConfig &&
        other.trashDays == trashDays &&
        other.externalDomain == externalDomain;
  }

  @override
  int get hashCode => trashDays.hashCode ^ externalDomain.hashCode;
}
