import 'package:chewie/chewie.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/asset_viewer/hooks/chewiew_controller_hook.dart';
import 'package:immich_mobile/modules/asset_viewer/ui/custom_video_player_controls.dart';
import 'package:video_player/video_player.dart';

class VideoPlayerViewer extends HookConsumerWidget {
  final VideoPlayerController controller;
  final Widget? placeholder;
  final Duration hideControlsTimer;
  final bool showControls;
  final bool showDownloadingIndicator;
  final bool autoPlay;

  const VideoPlayerViewer({
    super.key,
    required this.controller,
    this.placeholder,
    required this.hideControlsTimer,
    required this.showControls,
    required this.showDownloadingIndicator,
    this.autoPlay = true,
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
      showControls: showControls,
      hideControlsTimer: hideControlsTimer,
      autoPlay: autoPlay,
    );

    return Chewie(
      controller: chewie,
    );
  }
}
