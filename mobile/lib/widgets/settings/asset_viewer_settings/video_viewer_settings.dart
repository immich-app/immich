import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/infrastructure/metadata.provider.dart';
import 'package:immich_mobile/widgets/settings/setting_group_title.dart';
import 'package:immich_mobile/widgets/settings/settings_switch_list_tile.dart';

class VideoViewerSettings extends HookConsumerWidget {
  const VideoViewerSettings({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final viewer = ref.read(appConfigProvider).viewer;
    final useAutoPlayVideo = useState(viewer.autoPlayVideo);
    final useLoopVideo = useState(viewer.loopVideo);
    final useOriginalVideo = useState(viewer.loadOriginalVideo);

    useValueChanged<bool, void>(useAutoPlayVideo.value, (_, __) {
      ref.read(metadataProvider).write(.viewerAutoPlayVideo, useAutoPlayVideo.value);
    });
    useValueChanged<bool, void>(useLoopVideo.value, (_, __) {
      ref.read(metadataProvider).write(.viewerLoopVideo, useLoopVideo.value);
    });
    useValueChanged<bool, void>(useOriginalVideo.value, (_, __) {
      ref.read(metadataProvider).write(.viewerLoadOriginalVideo, useOriginalVideo.value);
    });

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
        ),
        SettingsSwitchListTile(
          valueNotifier: useLoopVideo,
          title: "setting_video_viewer_looping_title".t(context: context),
          subtitle: "loop_videos_description".t(context: context),
        ),
        SettingsSwitchListTile(
          valueNotifier: useOriginalVideo,
          title: "setting_video_viewer_original_video_title".t(context: context),
          subtitle: "setting_video_viewer_original_video_subtitle".t(context: context),
        ),
      ],
    );
  }
}
