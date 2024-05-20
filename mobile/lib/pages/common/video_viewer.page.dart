import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/providers/asset_viewer/show_controls.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_controller_provider.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_controls_provider.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_value_provider.dart';
import 'package:immich_mobile/widgets/asset_viewer/video_player.dart';
import 'package:immich_mobile/widgets/common/delayed_loading_indicator.dart';
import 'package:wakelock_plus/wakelock_plus.dart';

class VideoViewerPage extends HookConsumerWidget {
  final Asset asset;
  final bool isMotionVideo;
  final Widget? placeholder;
  final Duration hideControlsTimer;
  final bool showControls;
  final bool showDownloadingIndicator;
  final bool loopVideo;

  const VideoViewerPage({
    super.key,
    required this.asset,
    this.isMotionVideo = false,
    this.placeholder,
    this.showControls = true,
    this.hideControlsTimer = const Duration(seconds: 5),
    this.showDownloadingIndicator = true,
    this.loopVideo = false,
  });

  @override
  build(BuildContext context, WidgetRef ref) {
    final controller =
        ref.watch(videoPlayerControllerProvider(asset: asset)).value;
    // The last volume of the video used when mute is toggled
    final lastVolume = useState(0.5);

    // When the volume changes, set the volume
    ref.listen(videoPlayerControlsProvider.select((value) => value.mute),
        (_, mute) {
      if (mute) {
        controller?.setVolume(0.0);
      } else {
        controller?.setVolume(lastVolume.value);
      }
    });

    // When the position changes, seek to the position
    ref.listen(videoPlayerControlsProvider.select((value) => value.position),
        (_, position) {
      if (controller == null) {
        // No seeeking if there is no video
        return;
      }

      // Find the position to seek to
      final Duration seek = controller.value.duration * (position / 100.0);
      controller.seekTo(seek);
    });

    // When the custom video controls paus or plays
    ref.listen(videoPlayerControlsProvider.select((value) => value.pause),
        (lastPause, pause) {
      if (pause) {
        controller?.pause();
      } else {
        controller?.play();
      }
    });

    // Updates the [videoPlaybackValueProvider] with the current
    // position and duration of the video from the Chewie [controller]
    // Also sets the error if there is an error in the playback
    void updateVideoPlayback() {
      final videoPlayback = VideoPlaybackValue.fromController(controller);
      if (!loopVideo) {
        ref.read(videoPlaybackValueProvider.notifier).value = videoPlayback;
      }
      final state = videoPlayback.state;

      // Enable the WakeLock while the video is playing
      if (state == VideoPlaybackState.playing) {
        // Sync with the controls playing
        WakelockPlus.enable();
      } else {
        // Sync with the controls pause
        WakelockPlus.disable();
      }
    }

    // Adds and removes the listener to the video player
    useEffect(
      () {
        Future.microtask(
          () => ref.read(videoPlayerControlsProvider.notifier).reset(),
        );
        // Guard no controller
        if (controller == null) {
          return null;
        }

        // Hide the controls
        // Done in a microtask to avoid setting the state while the is building
        if (!isMotionVideo) {
          Future.microtask(() {
            ref.read(showControlsProvider.notifier).show = false;
          });
        }

        // Subscribes to listener
        controller.addListener(updateVideoPlayback);
        return () {
          // Removes listener when we dispose
          controller.removeListener(updateVideoPlayback);
          controller.pause();
        };
      },
      [controller],
    );

    final size = MediaQuery.sizeOf(context);

    return PopScope(
      onPopInvoked: (pop) {
        ref.read(videoPlaybackValueProvider.notifier).value =
            VideoPlaybackValue.uninitialized();
      },
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 400),
        child: Stack(
          children: [
            Visibility(
              visible: controller == null,
              child: Stack(
                children: [
                  if (placeholder != null) placeholder!,
                  const Positioned.fill(
                    child: Center(
                      child: DelayedLoadingIndicator(
                        fadeInDuration: Duration(milliseconds: 500),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            if (controller != null)
              SizedBox(
                height: size.height,
                width: size.width,
                child: VideoPlayerViewer(
                  controller: controller,
                  isMotionVideo: isMotionVideo,
                  placeholder: placeholder,
                  hideControlsTimer: hideControlsTimer,
                  showControls: showControls,
                  showDownloadingIndicator: showDownloadingIndicator,
                  loopVideo: loopVideo,
                ),
              ),
          ],
        ),
      ),
    );
  }
}
