import 'package:openapi/api.dart';

class ServerConfig {
  final int trashDays;
  final String mapTileUrl;

  const ServerConfig({
    required this.trashDays,
    required this.mapTileUrl,
  });

  ServerConfig copyWith({
    int? trashDays,
    String? mapTileUrl,
  }) {
    return ServerConfig(
      trashDays: trashDays ?? this.trashDays,
      mapTileUrl: mapTileUrl ?? this.mapTileUrl,
    );
  }

  @override
  String toString() {
    return 'ServerConfig(trashDays: $trashDays, mapTileUrl: $mapTileUrl)';
  }

  ServerConfig.fromDto(ServerConfigDto dto)
      : trashDays = dto.trashDays,
        mapTileUrl = dto.mapTileUrl;

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is ServerConfig &&
        other.trashDays == trashDays &&
        other.mapTileUrl == mapTileUrl;
  }

  @override
  int get hashCode {
    return trashDays.hashCode ^ mapTileUrl.hashCode;
  }
}
