import 'package:immich_mobile/domain/models/server-info/server_config.model.dart';
import 'package:immich_mobile/domain/models/server-info/server_disk_info.model.dart';
import 'package:immich_mobile/domain/models/server-info/server_features.model.dart';
import 'package:immich_mobile/domain/models/server-info/server_version.model.dart';

abstract interface class IServerApiRepository {
  /// Pings and check if server is reachable
  Future<void> pingServer();

  /// Fetches the list of enabled features in the server
  Future<ServerFeatures?> getServerFeatures();

  /// Fetches the server configuration and settings
  Future<ServerConfig?> getServerConfig();

  /// Fetches the server disk info
  Future<ServerDiskInfo?> getServerDiskInfo();

  /// Fetches the server version
  Future<ServerVersion?> getServerVersion();
}
