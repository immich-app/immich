import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
import 'package:immich_mobile/modules/settings/ui/settings_sub_title.dart';
import 'package:immich_mobile/modules/settings/ui/settings_switch_list_tile.dart';
import 'package:immich_mobile/modules/settings/utils/app_settings_update_hook.dart';

class VideoViewerSettings extends HookConsumerWidget {
  const VideoViewerSettings({
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final useLoopVideo = useAppSettingsState(AppSettingsEnum.loopVideo);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SettingsSubTitle(title: "Videos".tr()),
        SettingsSwitchListTile(
          valueNotifier: useLoopVideo,
          title: "Looping".tr(),
          subtitle:
              "Enable to automatically loop a video in the detail viewer.".tr(),
          onChanged: (_) => ref.invalidate(appSettingsServiceProvider),
        ),
      ],
    );
  }
}
