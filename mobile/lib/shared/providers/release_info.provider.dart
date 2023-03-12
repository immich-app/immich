import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:http/http.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/shared/views/version_announcement_overlay.dart';
import 'package:logging/logging.dart';

class ReleaseInfoNotifier extends StateNotifier<String> {
  ReleaseInfoNotifier() : super("");
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

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        String latestTagVersion = data["tag_name"];
        state = latestTagVersion;

        if (localReleaseVersion == null && latestTagVersion.isNotEmpty) {
          VersionAnnouncementOverlayController.appLoader.show();
          return;
        }

        if (latestTagVersion.isNotEmpty &&
            localReleaseVersion != latestTagVersion) {
          VersionAnnouncementOverlayController.appLoader.show();
          return;
        }
      }
    } catch (e) {
      debugPrint("Error gettting latest release version");

      state = "";
    }
  }

  void acknowledgeNewVersion() {
    Store.put(StoreKey.githubReleaseInfo, state);
    VersionAnnouncementOverlayController.appLoader.hide();
  }
}

final releaseInfoProvider = StateNotifierProvider<ReleaseInfoNotifier, String>(
  (ref) => ReleaseInfoNotifier(),
);
