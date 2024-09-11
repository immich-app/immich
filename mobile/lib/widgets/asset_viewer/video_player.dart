import 'package:chewie/chewie.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/utils/hooks/chewiew_controller_hook.dart';
import 'package:immich_mobile/widgets/asset_viewer/custom_video_player_controls.dart';
import 'package:video_player/video_player.dart';

class VideoPlayerViewer extends HookConsumerWidget {
  final VideoPlayerController controller;
  final bool isMotionVideo;
  final Widget? placeholder;
  final Duration hideControlsTimer;
  final bool showControls;
  final bool showDownloadingIndicator;
  final bool loopVideo;

  const VideoPlayerViewer({
    super.key,
    required this.controller,
    required this.isMotionVideo,
    this.placeholder,
    required this.hideControlsTimer,
    required this.showControls,
    required this.showDownloadingIndicator,
    required this.loopVideo,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final chewie = useChewieController(
      controller: controller,
      controlsSafeAreaMinimum: const EdgeInsets.only(
        bottom: 100,
      ),
      placeholder: SizedBox.expand(child: placeholder),
      customControls: CustomVideoPlayerControls(
        hideTimerDuration: hideControlsTimer,
      ),
      showControls: showControls && !isMotionVideo,
      hideControlsTimer: hideControlsTimer,
      loopVideo: loopVideo,
    );

    return Chewie(
      controller: chewie,
    );
  }
}
