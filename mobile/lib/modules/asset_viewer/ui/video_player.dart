import 'package:chewie/chewie.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/asset_viewer/hooks/chewiew_controller_hook.dart';
import 'package:immich_mobile/modules/asset_viewer/ui/custom_video_player_controls.dart';
import 'package:video_player/video_player.dart';

class VideoPlayerViewer extends HookConsumerWidget {
  final VideoPlayerController controller;
  final bool isMotionVideo;
  final Widget? placeholder;
  final Duration hideControlsTimer;
  final bool showControls;
  final bool showDownloadingIndicator;
  final bool autoPlayVideo;

  const VideoPlayerViewer({
    super.key,
    required this.controller,
    required this.isMotionVideo,
    this.placeholder,
    required this.hideControlsTimer,
    required this.showControls,
    required this.showDownloadingIndicator,
    this.autoPlayVideo = true,
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
      // Always auto play motion pictures, this component isn't rendered when the motion pictures are not playing
      // If it's a regular video, use the autoPlayVideo parameter
      autoPlay: isMotionVideo || autoPlayVideo,
    );

    return Chewie(
      controller: chewie,
    );
  }
}
