import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_mobile/widgets/settings/setting_group_title.dart';
import 'package:immich_mobile/widgets/settings/settings_switch_list_tile.dart';

class VideoViewerSettings extends HookConsumerWidget {
  const VideoViewerSettings({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final viewer = ref.watch(appConfigProvider).viewer;
    final useAutoPlayVideo = useState(viewer.autoPlayVideo);
    final useLoopVideo = useState(viewer.loopVideo);
    final useOriginalVideo = useState(viewer.loadOriginalVideo);

    useValueChanged<bool, void>(useAutoPlayVideo.value, (_, _) {
      unawaited(ref.read(settingsProvider).write(.viewerAutoPlayVideo, useAutoPlayVideo.value));
    });
    useValueChanged<bool, void>(useLoopVideo.value, (_, _) {
      unawaited(ref.read(settingsProvider).write(.viewerLoopVideo, useLoopVideo.value));
    });
    useValueChanged<bool, void>(useOriginalVideo.value, (_, _) {
      unawaited(ref.read(settingsProvider).write(.viewerLoadOriginalVideo, useOriginalVideo.value));
    });

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SettingGroupTitle(title: context.t.videos, icon: Icons.video_camera_back_outlined),
        SettingsSwitchListTile(
          valueNotifier: useAutoPlayVideo,
          title: context.t.setting_video_viewer_auto_play_title,
          subtitle: context.t.setting_video_viewer_auto_play_subtitle,
        ),
        SettingsSwitchListTile(
          valueNotifier: useLoopVideo,
          title: context.t.setting_video_viewer_looping_title,
          subtitle: context.t.loop_videos_description,
        ),
        SettingsSwitchListTile(
          valueNotifier: useOriginalVideo,
          title: context.t.setting_video_viewer_original_video_title,
          subtitle: context.t.setting_video_viewer_original_video_subtitle,
        ),
      ],
    );
  }
}
