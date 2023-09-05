import 'package:easy_localization/easy_localization.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import 'package:immich_mobile/shared/models/server_info_state.model.dart';
import 'package:immich_mobile/shared/services/server_info.service.dart';
import 'package:immich_mobile/utils/serverVersionReponseDto_to_string.dart';
import 'package:openapi/api.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:version/version.dart';

class ServerInfoNotifier extends StateNotifier<ServerInfoState> {
  ServerInfoNotifier(this._serverInfoService)
      : super(
          ServerInfoState(
            serverVersion: ServerVersionResponseDto(
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
    ServerVersionResponseDto? serverVersion =
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

    Version currentAppVersion = Version.parse(packageInfo.version);
    Version currentServerVersion =
        Version.parse(serverVersionReponseDtoToString(serverVersion));

    if (currentAppVersion > currentServerVersion) {
      state = state.copyWith(
        isVersionMismatch: true,
        versionMismatchErrorMessage:
            "version_outdated_menu_msg".tr(),
      );

      return;
    }

    state = state.copyWith(
      isVersionMismatch: false,
      versionMismatchErrorMessage: "",
    );
  }
}

final serverInfoProvider =
    StateNotifierProvider<ServerInfoNotifier, ServerInfoState>((ref) {
  return ServerInfoNotifier(ref.watch(serverInfoServiceProvider));
});
