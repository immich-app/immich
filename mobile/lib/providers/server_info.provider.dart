import 'package:easy_localization/easy_localization.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/server_info/server_config.model.dart';
import 'package:immich_mobile/models/server_info/server_disk_info.model.dart';
import 'package:immich_mobile/models/server_info/server_features.model.dart';
import 'package:immich_mobile/models/server_info/server_info.model.dart';
import 'package:immich_mobile/models/server_info/server_version.model.dart';
import 'package:immich_mobile/services/server_info.service.dart';
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
          isClientOutOfDate: false,
          isServerOutOfDate: false,
          isNewReleaseAvailable: false,
          versionMismatchErrorMessage: "",
          errorGettingVersions: false,
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
        state = state.copyWith(
          errorGettingVersions: true,
          versionMismatchErrorMessage: "profile_drawer_unable_to_check_version".tr(),
        );
        return;
      }

      await _checkServerVersionMismatch(serverVersion);
    } catch (e, stackTrace) {
      _log.severe("Failed to get server version", e, stackTrace);
      state = state.copyWith(
        errorGettingVersions: true,
        versionMismatchErrorMessage: "profile_drawer_unable_to_check_version".tr(),
      );
      return;
    }
  }

  _checkServerVersionMismatch(ServerVersion serverVersion) async {
    state = state.copyWith(serverVersion: serverVersion);

    var packageInfo = await PackageInfo.fromPlatform();

    Map<String, int> appVersion = _getDetailVersion(packageInfo.version);

    if (appVersion["major"]! > serverVersion.major || appVersion["minor"]! > serverVersion.minor) {
      state = state.copyWith(
        isServerOutOfDate: true,
        versionMismatchErrorMessage: "profile_drawer_server_out_of_date".tr(),
      );
      return;
    }

    if (appVersion["major"]! < serverVersion.major || appVersion["minor"]! < serverVersion.minor) {
      state = state.copyWith(
        isClientOutOfDate: true,
        versionMismatchErrorMessage: "profile_drawer_client_out_of_date".tr(),
      );
      return;
    }

    state = state.copyWith(isClientOutOfDate: false, isServerOutOfDate: false, versionMismatchErrorMessage: "");
  }

  handleNewRelease(ServerVersion serverVersion, ServerVersion latestVersion) {
    // Update local server version
    _checkServerVersionMismatch(serverVersion);

    final majorEqual = latestVersion.major == serverVersion.major;
    final minorEqual = majorEqual && latestVersion.minor == serverVersion.minor;
    final newVersionAvailable =
        latestVersion.major > serverVersion.major ||
        (majorEqual && latestVersion.minor > serverVersion.minor) ||
        (minorEqual && latestVersion.patch > serverVersion.patch);

    state = state.copyWith(latestVersion: latestVersion, isNewReleaseAvailable: newVersionAvailable);
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

  Map<String, int> _getDetailVersion(String version) {
    List<String> detail = version.split(".");

    var major = detail[0];
    var minor = detail[1];
    var patch = detail[2];

    return {"major": int.parse(major), "minor": int.parse(minor), "patch": int.parse(patch.replaceAll("-DEBUG", ""))};
  }
}

final serverInfoProvider = StateNotifierProvider<ServerInfoNotifier, ServerInfo>((ref) {
  return ServerInfoNotifier(ref.read(serverInfoServiceProvider));
});
