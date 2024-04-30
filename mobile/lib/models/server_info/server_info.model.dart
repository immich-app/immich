import 'package:immich_mobile/models/server_info/server_config.model.dart';
import 'package:immich_mobile/models/server_info/server_disk_info.model.dart';
import 'package:immich_mobile/models/server_info/server_features.model.dart';
import 'package:immich_mobile/models/server_info/server_version.model.dart';

class ServerInfo {
  final ServerVersion serverVersion;
  final ServerVersion latestVersion;
  final ServerFeatures serverFeatures;
  final ServerConfig serverConfig;
  final ServerDiskInfo serverDiskInfo;
  final bool isVersionMismatch;
  final bool isNewReleaseAvailable;
  final String versionMismatchErrorMessage;

  ServerInfo({
    required this.serverVersion,
    required this.latestVersion,
    required this.serverFeatures,
    required this.serverConfig,
    required this.serverDiskInfo,
    required this.isVersionMismatch,
    required this.isNewReleaseAvailable,
    required this.versionMismatchErrorMessage,
  });

  ServerInfo copyWith({
    ServerVersion? serverVersion,
    ServerVersion? latestVersion,
    ServerFeatures? serverFeatures,
    ServerConfig? serverConfig,
    ServerDiskInfo? serverDiskInfo,
    bool? isVersionMismatch,
    bool? isNewReleaseAvailable,
    String? versionMismatchErrorMessage,
  }) {
    return ServerInfo(
      serverVersion: serverVersion ?? this.serverVersion,
      latestVersion: latestVersion ?? this.latestVersion,
      serverFeatures: serverFeatures ?? this.serverFeatures,
      serverConfig: serverConfig ?? this.serverConfig,
      serverDiskInfo: serverDiskInfo ?? this.serverDiskInfo,
      isVersionMismatch: isVersionMismatch ?? this.isVersionMismatch,
      isNewReleaseAvailable:
          isNewReleaseAvailable ?? this.isNewReleaseAvailable,
      versionMismatchErrorMessage:
          versionMismatchErrorMessage ?? this.versionMismatchErrorMessage,
    );
  }

  @override
  String toString() {
    return 'ServerInfo(serverVersion: $serverVersion, latestVersion: $latestVersion, serverFeatures: $serverFeatures, serverConfig: $serverConfig, serverDiskInfo: $serverDiskInfo, isVersionMismatch: $isVersionMismatch, isNewReleaseAvailable: $isNewReleaseAvailable, versionMismatchErrorMessage: $versionMismatchErrorMessage)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is ServerInfo &&
        other.serverVersion == serverVersion &&
        other.latestVersion == latestVersion &&
        other.serverFeatures == serverFeatures &&
        other.serverConfig == serverConfig &&
        other.serverDiskInfo == serverDiskInfo &&
        other.isVersionMismatch == isVersionMismatch &&
        other.isNewReleaseAvailable == isNewReleaseAvailable &&
        other.versionMismatchErrorMessage == versionMismatchErrorMessage;
  }

  @override
  int get hashCode {
    return serverVersion.hashCode ^
        latestVersion.hashCode ^
        serverFeatures.hashCode ^
        serverConfig.hashCode ^
        serverDiskInfo.hashCode ^
        isVersionMismatch.hashCode ^
        isNewReleaseAvailable.hashCode ^
        versionMismatchErrorMessage.hashCode;
  }
}
