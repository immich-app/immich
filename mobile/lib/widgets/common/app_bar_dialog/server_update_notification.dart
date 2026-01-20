import 'dart:io';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/models/server_info/server_info.model.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:url_launcher/url_launcher_string.dart';

class ServerUpdateNotification extends HookConsumerWidget {
  const ServerUpdateNotification({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final serverInfoState = ref.watch(serverInfoProvider);

    Color errorColor = const Color.fromARGB(85, 253, 97, 83);
    Color infoColor = context.isDarkTheme ? context.primaryColor.withAlpha(55) : context.primaryColor.withAlpha(25);
    void openUpdateLink() {
      String url;
      if (serverInfoState.versionStatus == VersionStatus.serverOutOfDate) {
        url = kImmichLatestRelease;
      } else {
        if (Platform.isIOS) {
          url = kImmichAppStoreLink;
        } else if (Platform.isAndroid) {
          url = kImmichPlayStoreLink;
        } else {
          // Fallback to latest release for other/unknown platforms
          url = kImmichLatestRelease;
        }
      }

      launchUrlString(url, mode: LaunchMode.externalApplication);
    }

    return SizedBox(
      width: double.infinity,
      child: Container(
        decoration: BoxDecoration(
          color: serverInfoState.versionStatus == VersionStatus.error ? errorColor : infoColor,
          borderRadius: const BorderRadius.all(Radius.circular(8)),
          border: Border.all(
            color: serverInfoState.versionStatus == VersionStatus.error
                ? errorColor
                : context.primaryColor.withAlpha(50),
            width: 0.75,
          ),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Expanded(
              child: Text(
                serverInfoState.versionStatus.message,
                textAlign: TextAlign.start,
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
                style: context.textTheme.labelLarge,
              ),
            ),
            if (serverInfoState.versionStatus == VersionStatus.serverOutOfDate ||
                serverInfoState.versionStatus == VersionStatus.clientOutOfDate) ...[
              const SizedBox(width: 8),
              TextButton(
                onPressed: openUpdateLink,
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.all(4),
                  minimumSize: const Size(0, 0),
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: serverInfoState.versionStatus == VersionStatus.clientOutOfDate
                    ? Text("action_common_update".tr(context: context))
                    : Text("view".tr()),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
