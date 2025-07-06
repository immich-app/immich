import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/widgets/settings/core/setting_section_header.dart';
import 'package:immich_mobile/widgets/settings/core/setting_switch_list_tile.dart';
import 'package:immich_mobile/widgets/settings/layouts/settings_card_layout.dart';
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

    return SettingsCardLayout(
      header: const SettingSectionHeader(
        title: 'videos',
        icon: Icons.video_library_outlined,
      ),
      children: [
        SettingSwitchListTile(
          valueNotifier: useLoopVideo,
          title: 'setting_video_viewer_looping_title'.t(context: context),
          subtitle: 'loop_videos_description'.t(context: context),
          onChanged: (_) => ref.invalidate(appSettingsServiceProvider),
        ),
        SettingSwitchListTile(
          valueNotifier: useOriginalVideo,
          title:
              'setting_video_viewer_original_video_title'.t(context: context),
          subtitle: 'setting_video_viewer_original_video_subtitle'
              .t(context: context),
          onChanged: (_) => ref.invalidate(appSettingsServiceProvider),
        ),
      ],
    );
  }
}
