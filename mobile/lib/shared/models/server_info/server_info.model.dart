import 'package:immich_mobile/shared/models/server_info/server_config.model.dart';
import 'package:immich_mobile/shared/models/server_info/server_disk_info.model.dart';
import 'package:immich_mobile/shared/models/server_info/server_features.model.dart';
import 'package:immich_mobile/shared/models/server_info/server_version.model.dart';

class ServerInfo {
  final ServerVersion serverVersion;
  final ServerFeatures serverFeatures;
  final ServerConfig serverConfig;
  final ServerDiskInfo serverDiskInfo;
  final bool isVersionMismatch;
  final String versionMismatchErrorMessage;

  ServerInfo({
    required this.serverVersion,
    required this.serverFeatures,
    required this.serverConfig,
    required this.isVersionMismatch,
    required this.serverDiskInfo,
    required this.versionMismatchErrorMessage,
  });

  ServerInfo copyWith({
    ServerVersion? serverVersion,
    ServerFeatures? serverFeatures,
    ServerConfig? serverConfig,
    ServerDiskInfo? serverDiskInfo,
    bool? isVersionMismatch,
    String? versionMismatchErrorMessage,
  }) {
    return ServerInfo(
      serverVersion: serverVersion ?? this.serverVersion,
      serverFeatures: serverFeatures ?? this.serverFeatures,
      serverConfig: serverConfig ?? this.serverConfig,
      isVersionMismatch: isVersionMismatch ?? this.isVersionMismatch,
      versionMismatchErrorMessage:
          versionMismatchErrorMessage ?? this.versionMismatchErrorMessage,
      serverDiskInfo: serverDiskInfo ?? this.serverDiskInfo,
    );
  }

  @override
  String toString() {
    return 'ServerInfo(serverVersion: $serverVersion, serverFeatures: $serverFeatures, serverConfig: $serverConfig, isVersionMismatch: $isVersionMismatch, versionMismatchErrorMessage: $versionMismatchErrorMessage, serverDiskInfo: $serverDiskInfo)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is ServerInfo &&
        other.serverVersion == serverVersion &&
        other.serverFeatures == serverFeatures &&
        other.serverConfig == serverConfig &&
        other.serverDiskInfo == serverDiskInfo &&
        other.isVersionMismatch == isVersionMismatch &&
        other.versionMismatchErrorMessage == versionMismatchErrorMessage;
  }

  @override
  int get hashCode {
    return serverVersion.hashCode ^
        serverFeatures.hashCode ^
        serverConfig.hashCode ^
        isVersionMismatch.hashCode ^
        versionMismatchErrorMessage.hashCode ^
        serverDiskInfo.hashCode;
  }
}
