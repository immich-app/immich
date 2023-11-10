import 'package:openapi/api.dart';

class ServerConfig {
  final int trashDays;

  const ServerConfig({
    required this.trashDays,
  });

  ServerConfig copyWith({
    int? trashDays,
  }) {
    return ServerConfig(
      trashDays: trashDays ?? this.trashDays,
    );
  }

  @override
  String toString() {
    return 'ServerConfig(trashDays: $trashDays)';
  }

  ServerConfig.fromDto(ServerConfigDto dto) : trashDays = dto.trashDays;

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is ServerConfig && other.trashDays == trashDays;
  }

  @override
  int get hashCode {
    return trashDays.hashCode;
  }
}
