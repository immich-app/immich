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
  final bool isClientOutOfDate;
  final bool isServerOutOfDate;
  final bool isNewReleaseAvailable;
  final String versionMismatchErrorMessage;
  final bool errorGettingVersions;

  const ServerInfo({
    required this.serverVersion,
    required this.latestVersion,
    required this.serverFeatures,
    required this.serverConfig,
    required this.serverDiskInfo,
    required this.isClientOutOfDate,
    required this.isServerOutOfDate,
    required this.isNewReleaseAvailable,
    required this.versionMismatchErrorMessage,
    required this.errorGettingVersions,
  });

  ServerInfo copyWith({
    ServerVersion? serverVersion,
    ServerVersion? latestVersion,
    ServerFeatures? serverFeatures,
    ServerConfig? serverConfig,
    ServerDiskInfo? serverDiskInfo,
    bool? isClientOutOfDate,
    bool? isServerOutOfDate,
    bool? isNewReleaseAvailable,
    String? versionMismatchErrorMessage,
    bool? errorGettingVersions,
  }) {
    return ServerInfo(
      serverVersion: serverVersion ?? this.serverVersion,
      latestVersion: latestVersion ?? this.latestVersion,
      serverFeatures: serverFeatures ?? this.serverFeatures,
      serverConfig: serverConfig ?? this.serverConfig,
      serverDiskInfo: serverDiskInfo ?? this.serverDiskInfo,
      isClientOutOfDate: isClientOutOfDate ?? this.isClientOutOfDate,
      isServerOutOfDate: isServerOutOfDate ?? this.isServerOutOfDate,
      isNewReleaseAvailable: isNewReleaseAvailable ?? this.isNewReleaseAvailable,
      versionMismatchErrorMessage: versionMismatchErrorMessage ?? this.versionMismatchErrorMessage,
      errorGettingVersions: errorGettingVersions ?? this.errorGettingVersions,
    );
  }

  @override
  String toString() {
    return 'ServerInfo(serverVersion: $serverVersion, latestVersion: $latestVersion, serverFeatures: $serverFeatures, serverConfig: $serverConfig, serverDiskInfo: $serverDiskInfo, isClientOutOfDate: $isClientOutOfDate, isServerOutOfDate: $isServerOutOfDate, isNewReleaseAvailable: $isNewReleaseAvailable, versionMismatchErrorMessage: $versionMismatchErrorMessage, errorGettingVersions: $errorGettingVersions)';
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
        other.isClientOutOfDate == isClientOutOfDate &&
        other.isServerOutOfDate == isServerOutOfDate &&
        other.isNewReleaseAvailable == isNewReleaseAvailable &&
        other.versionMismatchErrorMessage == versionMismatchErrorMessage &&
        other.errorGettingVersions == errorGettingVersions;
  }

  @override
  int get hashCode {
    return serverVersion.hashCode ^
        latestVersion.hashCode ^
        serverFeatures.hashCode ^
        serverConfig.hashCode ^
        serverDiskInfo.hashCode ^
        isClientOutOfDate.hashCode ^
        isServerOutOfDate.hashCode ^
        isNewReleaseAvailable.hashCode ^
        versionMismatchErrorMessage.hashCode ^
        errorGettingVersions.hashCode;
  }
}
