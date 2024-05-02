import 'package:easy_localization/easy_localization.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/server_info/server_disk_info.model.dart';

import 'package:immich_mobile/models/server_info/server_info.model.dart';
import 'package:immich_mobile/shared/services/server_info.service.dart';
import 'package:immich_mobile/models/server_info/server_config.model.dart';
import 'package:immich_mobile/models/server_info/server_features.model.dart';
import 'package:immich_mobile/models/server_info/server_version.model.dart';
import 'package:logging/logging.dart';
import 'package:package_info_plus/package_info_plus.dart';

class ServerInfoNotifier extends StateNotifier<ServerInfo> {
  ServerInfoNotifier(this._serverInfoService)
      : super(
          ServerInfo(
            serverVersion: const ServerVersion(
              major: 0,
              minor: 0,
              patch: 0,
            ),
            latestVersion: const ServerVersion(
              major: 0,
              minor: 0,
              patch: 0,
            ),
            serverFeatures: const ServerFeatures(
              map: true,
              trash: true,
              oauthEnabled: false,
              passwordLogin: true,
            ),
            serverConfig: const ServerConfig(
              trashDays: 30,
              oauthButtonText: '',
              externalDomain: '',
            ),
            serverDiskInfo: const ServerDiskInfo(
              diskAvailable: "0",
              diskSize: "0",
              diskUse: "0",
              diskUsagePercentage: 0,
            ),
            isVersionMismatch: false,
            isNewReleaseAvailable: false,
            versionMismatchErrorMessage: "",
          ),
        );

  final ServerInfoService _serverInfoService;
  final _log = Logger("ServerInfoNotifier");

  Future<void> getServerInfo() async {
    await getServerVersion();
    await getServerFeatures();
    await getServerConfig();
  }

  getServerVersion() async {
    try {
      final serverVersion = await _serverInfoService.getServerVersion();

      if (serverVersion == null) {
        state = state.copyWith(
          isVersionMismatch: true,
          versionMismatchErrorMessage: "common_server_error".tr(),
        );
        return;
      }

      await _checkServerVersionMismatch(serverVersion);
    } catch (e, stackTrace) {
      _log.severe("Failed to get server version", e, stackTrace);
      state = state.copyWith(
        isVersionMismatch: true,
      );
      return;
    }
  }

  _checkServerVersionMismatch(ServerVersion serverVersion) async {
    state = state.copyWith(serverVersion: serverVersion);

    var packageInfo = await PackageInfo.fromPlatform();

    Map<String, int> appVersion = _getDetailVersion(packageInfo.version);

    if (appVersion["major"]! > serverVersion.major) {
      state = state.copyWith(
        isVersionMismatch: true,
        versionMismatchErrorMessage:
            "profile_drawer_server_out_of_date_major".tr(),
      );
      return;
    }

    if (appVersion["major"]! < serverVersion.major) {
      state = state.copyWith(
        isVersionMismatch: true,
        versionMismatchErrorMessage:
            "profile_drawer_client_out_of_date_major".tr(),
      );
      return;
    }

    if (appVersion["minor"]! > serverVersion.minor) {
      state = state.copyWith(
        isVersionMismatch: true,
        versionMismatchErrorMessage:
            "profile_drawer_server_out_of_date_minor".tr(),
      );
      return;
    }

    if (appVersion["minor"]! < serverVersion.minor) {
      state = state.copyWith(
        isVersionMismatch: true,
        versionMismatchErrorMessage:
            "profile_drawer_client_out_of_date_minor".tr(),
      );
      return;
    }

    state = state.copyWith(
      isVersionMismatch: false,
      versionMismatchErrorMessage: "",
    );
  }

  handleNewRelease(
    ServerVersion serverVersion,
    ServerVersion latestVersion,
  ) {
    // Update local server version
    _checkServerVersionMismatch(serverVersion);

    final majorEqual = latestVersion.major == serverVersion.major;
    final minorEqual = majorEqual && latestVersion.minor == serverVersion.minor;
    final newVersionAvailable = latestVersion.major > serverVersion.major ||
        (majorEqual && latestVersion.minor > serverVersion.minor) ||
        (minorEqual && latestVersion.patch > serverVersion.patch);

    state = state.copyWith(
      latestVersion: latestVersion,
      isNewReleaseAvailable: newVersionAvailable,
    );
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

    return {
      "major": int.parse(major),
      "minor": int.parse(minor),
      "patch": int.parse(patch.replaceAll("-DEBUG", "")),
    };
  }
}

final serverInfoProvider =
    StateNotifierProvider<ServerInfoNotifier, ServerInfo>((ref) {
  return ServerInfoNotifier(ref.read(serverInfoServiceProvider));
});
