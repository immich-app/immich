import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/widgets/settings/settings_sub_title.dart';
import 'package:immich_mobile/widgets/settings/settings_switch_list_tile.dart';
import 'package:immich_mobile/utils/hooks/app_settings_update_hook.dart';

class VideoViewerSettings extends HookConsumerWidget {
  const VideoViewerSettings({
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final useLoopVideo = useAppSettingsState(AppSettingsEnum.loopVideo);
    final useOriginalVideo =
        useAppSettingsState(AppSettingsEnum.loadOriginalVideo);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SettingsSubTitle(title: "videos".tr()),
        SettingsSwitchListTile(
          valueNotifier: useLoopVideo,
          title: "setting_video_viewer_looping_title".tr(),
          subtitle: "loop_videos_description".tr(),
          onChanged: (_) => ref.invalidate(appSettingsServiceProvider),
        ),
        SettingsSwitchListTile(
          valueNotifier: useOriginalVideo,
          title: "setting_video_viewer_original_video_title".tr(),
          subtitle: "setting_video_viewer_original_video_subtitle".tr(),
          onChanged: (_) => ref.invalidate(appSettingsServiceProvider),
        ),
      ],
    );
  }
}
