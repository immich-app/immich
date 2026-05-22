import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/widgets/settings/setting_group_title.dart';
import 'package:immich_mobile/widgets/settings/settings_switch_list_tile.dart';
import 'package:immich_mobile/utils/hooks/app_settings_update_hook.dart';

class VideoViewerSettings extends HookConsumerWidget {
  const VideoViewerSettings({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final useLoopVideo = useAppSettingsState(AppSettingsEnum.loopVideo);
    final useOriginalVideo = useAppSettingsState(AppSettingsEnum.loadOriginalVideo);
    final useAutoPlayVideo = useAppSettingsState(AppSettingsEnum.autoPlayVideo);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SettingGroupTitle(
          title: "videos".t(context: context),
          icon: Icons.video_camera_back_outlined,
        ),
        SettingsSwitchListTile(
          valueNotifier: useAutoPlayVideo,
          title: "setting_video_viewer_auto_play_title".t(context: context),
          subtitle: "setting_video_viewer_auto_play_subtitle".t(context: context),
          onChanged: (_) => ref.invalidate(appSettingsServiceProvider),
        ),
        SettingsSwitchListTile(
          valueNotifier: useLoopVideo,
          title: "setting_video_viewer_looping_title".t(context: context),
          subtitle: "loop_videos_description".t(context: context),
          onChanged: (_) => ref.invalidate(appSettingsServiceProvider),
        ),
        SettingsSwitchListTile(
          valueNotifier: useOriginalVideo,
          title: "setting_video_viewer_original_video_title".t(context: context),
          subtitle: "setting_video_viewer_original_video_subtitle".t(context: context),
          onChanged: (_) => ref.invalidate(appSettingsServiceProvider),
        ),
      ],
    );
  }
}
