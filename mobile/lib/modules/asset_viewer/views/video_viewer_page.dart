import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/asset_viewer/providers/show_controls.provider.dart';
import 'package:immich_mobile/modules/asset_viewer/providers/video_player_controller_provider.dart';
import 'package:immich_mobile/modules/asset_viewer/providers/video_player_controls_provider.dart';
import 'package:immich_mobile/modules/asset_viewer/providers/video_player_value_provider.dart';
import 'package:immich_mobile/modules/asset_viewer/ui/video_player.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/ui/delayed_loading_indicator.dart';
import 'package:wakelock_plus/wakelock_plus.dart';

@RoutePage()
// ignore: must_be_immutable
class VideoViewerPage extends HookConsumerWidget {
  final Asset asset;
  final Widget? placeholder;
  final Duration hideControlsTimer;
  final bool showControls;
  final bool showDownloadingIndicator;

  const VideoViewerPage({
    super.key,
    required this.asset,
    this.placeholder,
    this.showControls = true,
    this.hideControlsTimer = const Duration(seconds: 5),
    this.showDownloadingIndicator = true,
  });

  @override
  build(BuildContext context, WidgetRef ref) {
    final controller =
        ref.watch(videoPlayerControllerProvider(asset: asset)).value;
    final isMotionVideo = asset.livePhotoVideoId != null;
    final autoPlay = ref.read(
      appSettingsServiceProvider
          .select((s) => s.getSetting(AppSettingsEnum.autoPlayVideos)),
    );

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
      ref.read(videoPlaybackValueProvider.notifier).value = videoPlayback;
      final state = videoPlayback.state;

      // Enable the WakeLock while the video is playing
      if (state == VideoPlaybackState.playing) {
        // Sync with the controls playing
        WakelockPlus.enable();
      } else {
        if (state == VideoPlaybackState.completed) {
          ref.read(videoPlayerControlsProvider.notifier).pause();
        }
        // Sync with the controls pause
        WakelockPlus.disable();
      }
    }

    // Adds and removes the listener to the video player
    useEffect(
      () {
        Future.microtask(
          () => ref.read(videoPlayerControlsProvider.notifier).reset(!autoPlay),
        );
        // Guard no controller
        if (controller == null) {
          return null;
        }

        // Hide the controls
        // Done in a microtask to avoid setting the state while the is building
        // Don't hide the controls if autoplay is disabled
        if (!isMotionVideo && autoPlay) {
          Future.microtask(
            () => ref.read(showControlsProvider.notifier).show = false,
          );
        }

        /// Reset state of controller and controls to new video to update video controls
        Future.microtask(updateVideoPlayback);
        // Subscribes to listener
        controller.addListener(updateVideoPlayback);
        return () {
          controller.removeListener(updateVideoPlayback);
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
                  placeholder: placeholder,
                  hideControlsTimer: hideControlsTimer,
                  showControls: !isMotionVideo && showControls,
                  showDownloadingIndicator: showDownloadingIndicator,
                  autoPlay: isMotionVideo || autoPlay,
                ),
              ),
          ],
        ),
      ),
    );
  }
}
