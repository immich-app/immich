import 'package:easy_localization/easy_localization.dart';
import 'package:immich_mobile/models/server_info/server_config.model.dart';
import 'package:immich_mobile/models/server_info/server_disk_info.model.dart';
import 'package:immich_mobile/models/server_info/server_features.model.dart';
import 'package:immich_mobile/models/server_info/server_version.model.dart';

enum VersionStatus {
  upToDate,
  clientOutOfDate,
  serverOutOfDate,
  error;

  String get message => switch (this) {
    VersionStatus.upToDate => "",
    VersionStatus.clientOutOfDate => "app_update_available".tr(),
    VersionStatus.serverOutOfDate => "server_update_available".tr(),
    VersionStatus.error => "unable_to_check_version".tr(),
  };
}

class ServerInfo {
  final ServerVersion serverVersion;
  final ServerVersion latestVersion;
  final ServerFeatures serverFeatures;
  final ServerConfig serverConfig;
  final ServerDiskInfo serverDiskInfo;
  final VersionStatus versionStatus;

  const ServerInfo({
    required this.serverVersion,
    required this.latestVersion,
    required this.serverFeatures,
    required this.serverConfig,
    required this.serverDiskInfo,
    required this.versionStatus,
  });

  ServerInfo copyWith({
    ServerVersion? serverVersion,
    ServerVersion? latestVersion,
    ServerFeatures? serverFeatures,
    ServerConfig? serverConfig,
    ServerDiskInfo? serverDiskInfo,
    VersionStatus? versionStatus,
  }) {
    return ServerInfo(
      serverVersion: serverVersion ?? this.serverVersion,
      latestVersion: latestVersion ?? this.latestVersion,
      serverFeatures: serverFeatures ?? this.serverFeatures,
      serverConfig: serverConfig ?? this.serverConfig,
      serverDiskInfo: serverDiskInfo ?? this.serverDiskInfo,
      versionStatus: versionStatus ?? this.versionStatus,
    );
  }

  @override
  String toString() {
    return 'ServerInfo(serverVersion: $serverVersion, latestVersion: $latestVersion, serverFeatures: $serverFeatures, serverConfig: $serverConfig, serverDiskInfo: $serverDiskInfo, versionStatus: $versionStatus)';
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
        other.versionStatus == versionStatus;
  }

  @override
  int get hashCode {
    return serverVersion.hashCode ^
        latestVersion.hashCode ^
        serverFeatures.hashCode ^
        serverConfig.hashCode ^
        serverDiskInfo.hashCode ^
        versionStatus.hashCode;
  }
}
