import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:http/http.dart';
import 'package:immich_mobile/shared/models/server_info_state.model.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/shared/services/server_info.service.dart';
import 'package:immich_mobile/shared/views/version_announcement_overlay.dart';
import 'package:immich_mobile/utils/builtin_extensions.dart';
import 'package:immich_mobile/utils/server_version_reponse_dto_to_string.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';
import 'package:version/version.dart';

class ReleaseInfoNotifier extends StateNotifier<ServerInfoState> {
  ReleaseInfoNotifier(this._serverInfoService)
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

  final log = Logger('ReleaseInfoNotifier');
  void checkGithubReleaseInfo() async {
    final Client client = Client();

    try {
      final String? localReleaseVersion =
          Store.tryGet(StoreKey.githubReleaseInfo);
      final res = await client.get(
        Uri.parse(
          "https://api.github.com/repos/immich-app/immich/releases/latest",
        ),
        headers: {"Accept": "application/vnd.github.v3+json"},
      );

      ServerVersionResponseDto? serverVersion =
          await _serverInfoService.getServerVersion();

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        String latestTagVersion = data["tag_name"].replaceAll("v", "");
        List<String> latestTagVersionSectioned = latestTagVersion.split(".");
        state = state.copyWith(
          serverVersion: ServerVersionResponseDto(
            major: latestTagVersionSectioned[0].toInt(),
            patch_: latestTagVersionSectioned[2].toInt(),
            minor: latestTagVersionSectioned[1].toInt(),
          ),
        );

        // If server is already updated, ignore the new version announcement
        if (serverVersion != null &&
            Version.parse(serverVersionReponseDtoToString(serverVersion)) ==
                Version.parse(latestTagVersion)) {
          debugPrint("Server is already updated");
          return;
        }

        if (localReleaseVersion == null && latestTagVersion.isNotEmpty) {
          VersionAnnouncementOverlayController.appLoader.show();
          debugPrint("Release accouncement has not been shown yet");
          return;
        }

        // If local release version is not the same as the latest release version, show the new version announcement
        if (latestTagVersion.isNotEmpty &&
            (localReleaseVersion == null ||
                Version.parse(localReleaseVersion.replaceAll("v", "")) <
                    Version.parse(latestTagVersion))) {
          VersionAnnouncementOverlayController.appLoader.show();
          return;
        }
      }
    } catch (e) {
      debugPrint("Error gettting latest release version");

      state = ServerInfoState(
        serverVersion: ServerVersionResponseDto(
          major: 0,
          patch_: 0,
          minor: 0,
        ),
        isVersionMismatch: false,
        versionMismatchErrorMessage: "",
      );
    }
  }

  void acknowledgeNewVersion() {
    Store.put(StoreKey.githubReleaseInfo, state);
    VersionAnnouncementOverlayController.appLoader.hide();
  }
}

final releaseInfoProvider =
    StateNotifierProvider<ReleaseInfoNotifier, ServerInfoState>((ref) {
  return ReleaseInfoNotifier(ref.watch(serverInfoServiceProvider));
});
