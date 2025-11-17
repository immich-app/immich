import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/models/server_info/server_config.model.dart';
import 'package:immich_mobile/models/server_info/server_disk_info.model.dart';
import 'package:immich_mobile/models/server_info/server_features.model.dart';
import 'package:immich_mobile/models/server_info/server_info.model.dart';
import 'package:immich_mobile/models/server_info/server_version.model.dart';
import 'package:immich_mobile/services/server_info.service.dart';
import 'package:immich_mobile/utils/semver.dart';
import 'package:logging/logging.dart';
import 'package:package_info_plus/package_info_plus.dart';

class ServerInfoNotifier extends StateNotifier<ServerInfo> {
  ServerInfoNotifier(this._serverInfoService)
    : super(
        const ServerInfo(
          serverVersion: ServerVersion(major: 0, minor: 0, patch: 0),
          latestVersion: ServerVersion(major: 0, minor: 0, patch: 0),
          serverFeatures: ServerFeatures(map: true, trash: true, oauthEnabled: false, passwordLogin: true),
          serverConfig: ServerConfig(
            trashDays: 30,
            oauthButtonText: '',
            externalDomain: '',
            mapLightStyleUrl: 'https://tiles.immich.cloud/v1/style/light.json',
            mapDarkStyleUrl: 'https://tiles.immich.cloud/v1/style/dark.json',
          ),
          serverDiskInfo: ServerDiskInfo(diskAvailable: "0", diskSize: "0", diskUse: "0", diskUsagePercentage: 0),
          versionStatus: VersionStatus.upToDate,
        ),
      );

  final ServerInfoService _serverInfoService;
  final _log = Logger("ServerInfoNotifier");

  Future<void> getServerInfo() async {
    await getServerVersion();
    await getServerFeatures();
    await getServerConfig();
  }

  Future<void> getServerVersion() async {
    try {
      final serverVersion = await _serverInfoService.getServerVersion();

      // using isClientOutOfDate since that will show to users reguardless of if they are an admin
      if (serverVersion == null) {
        state = state.copyWith(versionStatus: VersionStatus.error);
        return;
      }

      await _checkServerVersionMismatch(serverVersion);
    } catch (e, stackTrace) {
      _log.severe("Failed to get server version", e, stackTrace);
      state = state.copyWith(versionStatus: VersionStatus.error);
      return;
    }
  }

  _checkServerVersionMismatch(ServerVersion serverVersion, {ServerVersion? latestVersion}) async {
    state = state.copyWith(serverVersion: serverVersion, latestVersion: latestVersion);

    var packageInfo = await PackageInfo.fromPlatform();
    SemVer clientVersion = SemVer.fromString(packageInfo.version);

    if (serverVersion < clientVersion || (latestVersion != null && serverVersion < latestVersion)) {
      state = state.copyWith(versionStatus: VersionStatus.serverOutOfDate);
      return;
    }

    if (clientVersion < serverVersion && clientVersion.differenceType(serverVersion) != SemVerType.patch) {
      state = state.copyWith(versionStatus: VersionStatus.clientOutOfDate);
      return;
    }

    state = state.copyWith(versionStatus: VersionStatus.upToDate);
  }

  handleReleaseInfo(ServerVersion serverVersion, ServerVersion latestVersion) {
    // Update local server version
    _checkServerVersionMismatch(serverVersion, latestVersion: latestVersion);
  }

  getServerFeatures() async {
    final serverFeatures = await _serverInfoService.getServerFeatures();
    if (serverFeatures == null) {
      return;
    }
    state = state.copyWith(serverFeatures: serverFeatures);
  }

  getServerConfig() async {
    final serverConfig = await _serverInfoService.getServerConfig();
    if (serverConfig == null) {
      return;
    }
    state = state.copyWith(serverConfig: serverConfig);
  }
}

final serverInfoProvider = StateNotifierProvider<ServerInfoNotifier, ServerInfo>((ref) {
  return ServerInfoNotifier(ref.read(serverInfoServiceProvider));
});

final versionWarningPresentProvider = Provider.family<bool, UserDto?>((ref, user) {
  final serverInfo = ref.watch(serverInfoProvider);
  return serverInfo.versionStatus == VersionStatus.clientOutOfDate ||
      serverInfo.versionStatus == VersionStatus.error ||
      ((user?.isAdmin ?? false) && serverInfo.versionStatus == VersionStatus.serverOutOfDate);
});
