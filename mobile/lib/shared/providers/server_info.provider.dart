import 'package:easy_localization/easy_localization.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import 'package:immich_mobile/shared/models/server_info_state.model.dart';
import 'package:immich_mobile/shared/services/server_info.service.dart';
import 'package:openapi/api.dart';
import 'package:package_info_plus/package_info_plus.dart';

class ServerInfoNotifier extends StateNotifier<ServerInfoState> {
  ServerInfoNotifier(this._serverInfoService)
      : super(
          ServerInfoState(
            serverVersion: ServerVersionReponseDto(
              major: 0,
              patch_: 0,
              minor: 0,
            ),
            isVersionMismatch: false,
            versionMismatchErrorMessage: "",
          ),
        );

  final ServerInfoService _serverInfoService;

  getServerVersion() async {
    ServerVersionReponseDto? serverVersion =
        await _serverInfoService.getServerVersion();

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
            "Server is out of date in major version. Some functionalities might not work correctly. Download and rebuild server",
      );

      return;
    }

    if (appVersion["minor"]! > serverVersion.minor) {
      state = state.copyWith(
        isVersionMismatch: true,
        versionMismatchErrorMessage:
            "Server is out of date in minor version. Some functionalities might not work correctly. Consider download and rebuild server",
      );

      return;
    }

    state = state.copyWith(
      isVersionMismatch: false,
      versionMismatchErrorMessage: "",
    );
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
    StateNotifierProvider<ServerInfoNotifier, ServerInfoState>((ref) {
  return ServerInfoNotifier(ref.watch(serverInfoServiceProvider));
});
