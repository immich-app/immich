import 'package:easy_localization/easy_localization.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/models/server_info/server_disk_info.model.dart';

import 'package:immich_mobile/shared/models/server_info/server_info.model.dart';
import 'package:immich_mobile/shared/services/server_info.service.dart';
import 'package:immich_mobile/shared/models/server_info/server_config.model.dart';
import 'package:immich_mobile/shared/models/server_info/server_features.model.dart';
import 'package:immich_mobile/shared/models/server_info/server_version.model.dart';
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
            serverFeatures: const ServerFeatures(
              map: true,
              trash: true,
            ),
            serverConfig: const ServerConfig(
              trashDays: 30,
            ),
            serverDiskInfo: const ServerDiskInfo(
              diskAvailable: "0",
              diskSize: "0",
              diskUse: "0",
              diskUsagePercentage: 0,
            ),
            isVersionMismatch: false,
            versionMismatchErrorMessage: "",
          ),
        );

  final ServerInfoService _serverInfoService;

  getServerInfo() {
    getServerVersion();
    getServerFeatures();
    getServerConfig();
  }

  getServerVersion() async {
    final serverVersion = await _serverInfoService.getServerVersion();

    if (serverVersion == null) {
      state = state.copyWith(
        isVersionMismatch: true,
        versionMismatchErrorMessage: "common_server_error".tr(),
      );
      return;
    }

    state = state.copyWith(serverVersion: serverVersion);

    var packageInfo = await PackageInfo.fromPlatform();

    Map<String, int> appVersion = _getDetailVersion(packageInfo.version);

    if (appVersion["major"]! > serverVersion.major) {
      state = state.copyWith(
        isVersionMismatch: true,
        versionMismatchErrorMessage:
            "Server is out of date. Please update to the latest major version.",
      );

      return;
    }

    if (appVersion["minor"]! > serverVersion.minor) {
      state = state.copyWith(
        isVersionMismatch: true,
        versionMismatchErrorMessage:
            "Server is out of date. Consider updating to the latest minor version.",
      );

      return;
    }

    state = state.copyWith(
      isVersionMismatch: false,
      versionMismatchErrorMessage: "",
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
  return ServerInfoNotifier(ref.watch(serverInfoServiceProvider));
});
