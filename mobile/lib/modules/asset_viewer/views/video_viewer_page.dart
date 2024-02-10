import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:chewie/chewie.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:immich_mobile/modules/asset_viewer/hooks/chewiew_controller_hook.dart';
import 'package:immich_mobile/modules/asset_viewer/ui/video_player_controls.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/ui/delayed_loading_indicator.dart';

@RoutePage()
// ignore: must_be_immutable
class VideoViewerPage extends HookWidget {
  final Asset asset;
  final bool isMotionVideo;
  final Widget? placeholder;
  final VoidCallback? onVideoEnded;
  final VoidCallback? onPlaying;
  final VoidCallback? onPaused;
  final Duration hideControlsTimer;
  final bool showControls;
  final bool showDownloadingIndicator;

  const VideoViewerPage({
    super.key,
    required this.asset,
    this.isMotionVideo = false,
    this.onVideoEnded,
    this.onPlaying,
    this.onPaused,
    this.placeholder,
    this.showControls = true,
    this.hideControlsTimer = const Duration(seconds: 5),
    this.showDownloadingIndicator = true,
  });

  @override
  Widget build(BuildContext context) {
    final controller = useChewieController(
      asset,
      controlsSafeAreaMinimum: const EdgeInsets.only(
        bottom: 100,
      ),
      placeholder: placeholder,
      showControls: showControls && !isMotionVideo,
      hideControlsTimer: hideControlsTimer,
      customControls: const VideoPlayerControls(),
      onPlaying: onPlaying,
      onPaused: onPaused,
      onVideoEnded: onVideoEnded,
    );

    // Loading
    return PopScope(
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 400),
        child: Builder(
          builder: (context) {
            if (controller == null) {
              return Stack(
                children: [
                  if (placeholder != null) placeholder!,
                  const DelayedLoadingIndicator(
                    fadeInDuration: Duration(milliseconds: 500),
                  ),
                ],
              );
            }

            final size = MediaQuery.of(context).size;
            return SizedBox(
              height: size.height,
              width: size.width,
              child: Chewie(
                controller: controller,
              ),
            );
          },
        ),
      ),
    );
  }
}
