import 'package:immich_mobile/domain/models/server-info/server_config.model.dart';
import 'package:immich_mobile/domain/models/server-info/server_disk_info.model.dart';
import 'package:immich_mobile/domain/models/server-info/server_features.model.dart';
import 'package:immich_mobile/domain/models/server-info/server_version.model.dart';

class ServerInfo {
  final ServerFeatures features;
  final ServerConfig config;
  final ServerDiskInfo disk;
  final ServerVersion version;

  const ServerInfo({
    required this.features,
    required this.config,
    required this.disk,
    required this.version,
  });

  ServerInfo copyWith({
    ServerFeatures? features,
    ServerConfig? config,
    ServerDiskInfo? disk,
    ServerVersion? version,
  }) {
    return ServerInfo(
      features: features ?? this.features,
      config: config ?? this.config,
      disk: disk ?? this.disk,
      version: version ?? this.version,
    );
  }

  const ServerInfo.initial()
      : features = const ServerFeatures.initial(),
        config = const ServerConfig.initial(),
        disk = const ServerDiskInfo.initial(),
        version = const ServerVersion.initial();

  @override
  String toString() =>
      'ServerInfo(features: $features, config: $config, disk: $disk, version: $version)';

  @override
  bool operator ==(covariant ServerInfo other) {
    if (identical(this, other)) return true;

    return other.features == features &&
        other.config == config &&
        other.disk == disk &&
        other.version == version;
  }

  @override
  int get hashCode =>
      features.hashCode ^ config.hashCode ^ disk.hashCode ^ version.hashCode;
}
