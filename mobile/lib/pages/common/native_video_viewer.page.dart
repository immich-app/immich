import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart' hide Store;
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/asset_viewer/show_controls.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_controls_provider.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_value_provider.dart';
import 'package:immich_mobile/utils/hooks/interval_hook.dart';
import 'package:immich_mobile/widgets/asset_viewer/custom_video_player_controls.dart';
import 'package:logging/logging.dart';
import 'package:native_video_player/native_video_player.dart';
import 'package:wakelock_plus/wakelock_plus.dart';

// @override
// void dispose() {
//   bufferingTimer.value.cancel();
//   try {
//     controller.value?.onPlaybackPositionChanged
//         .removeListener(onPlaybackPositionChanged);
//     controller.value?.onPlaybackStatusChanged
//         .removeListener(onPlaybackPositionChanged);
//     controller.value?.onPlaybackReady.removeListener(onPlaybackReady);
//     controller.value?.onPlaybackEnded.removeListener(onPlaybackEnded);
//     controller.value?.stop();
//   } catch (_) {
//     // Consume error from the controller
//   }
//   super.dispose();
// }

class NativeVideoViewerPage extends HookConsumerWidget {
  final Future<VideoSource> videoSource;
  final double aspectRatio;
  final Duration duration;
  final bool isMotionVideo;
  final bool showControls;
  final Duration hideControlsTimer;
  final bool loopVideo;

  const NativeVideoViewerPage({
    super.key,
    required this.videoSource,
    required this.aspectRatio,
    required this.duration,
    this.isMotionVideo = false,
    this.showControls = true,
    this.hideControlsTimer = const Duration(seconds: 5),
    this.loopVideo = false,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final controller = useRef<NativeVideoPlayerController?>(null);
    final lastVideoPosition = useRef(-1);
    final isBuffering = useRef(false);

    final log = Logger('NativeVideoViewerPage');
    log.info('Building NativeVideoViewerPage');

    void checkIfBuffering([Timer? timer]) {
      if (!context.mounted) {
        return timer?.cancel();
      }

      log.info('Checking if buffering');
      final videoPlayback = ref.read(videoPlaybackValueProvider);
      if ((isBuffering.value ||
              videoPlayback.state == VideoPlaybackState.initializing) &&
          videoPlayback.state != VideoPlaybackState.buffering) {
        log.info('Marking video as buffering');
        ref.read(videoPlaybackValueProvider.notifier).value =
            videoPlayback.copyWith(state: VideoPlaybackState.buffering);
      }
    }

    // timer to mark videos as buffering if the position does not change
    useInterval(const Duration(seconds: 5), checkIfBuffering);

    // When the volume changes, set the volume
    ref.listen(videoPlayerControlsProvider.select((value) => value.mute),
        (_, mute) {
      final playerController = controller.value;
      if (playerController == null) {
        log.info('No controller to seek to');
        return;
      }

      try {
        if (mute) {
          log.info('Muting video');
          playerController.setVolume(0.0);
          log.info('Muted video');
        } else {
          log.info('Unmuting video');
          playerController.setVolume(0.7);
          log.info('Unmuted video');
        }
      } catch (error) {
        log.severe('Error setting volume: $error');
        // Consume error from the controller
      }
    });

    // When the position changes, seek to the position
    ref.listen(videoPlayerControlsProvider.select((value) => value.position),
        (_, position) {
      final playerController = controller.value;
      if (playerController == null) {
        log.info('No controller to seek to');
        // No seeeking if there is no video
        return;
      }

      // Find the position to seek to
      final Duration seek = duration * (position / 100.0);
      try {
        log.info('Seeking to position: ${seek.inSeconds}');
        playerController.seekTo(seek.inSeconds);
        log.info('Seeked to position: ${seek.inSeconds}');
      } catch (error) {
        log.severe('Error seeking to position $position: $error');
        // Consume error from the controller
      }
    });

    // // When the custom video controls pause or play
    ref.listen(videoPlayerControlsProvider.select((value) => value.pause),
        (_, pause) {
      try {
        if (pause) {
          log.info('Pausing video');
          controller.value?.pause();
          log.info('Paused video');
        } else {
          log.info('Playing video');
          controller.value?.play();
          log.info('Played video');
        }
      } catch (error) {
        log.severe('Error pausing or playing video: $error');
        // Consume error from the controller
      }
    });

    void onPlaybackReady() {
      try {
        log.info('onPlaybackReady: Playing video');
        controller.value?.play();
        controller.value?.setVolume(0.9);
        log.info('onPlaybackReady: Played video');
      } catch (error) {
        log.severe('Error playing video: $error');
        // Consume error from the controller
      }
    }

    void onPlaybackPositionChanged() {
      if (controller.value == null || !context.mounted) {
        log.info('No controller to update');
        return;
      }

      log.info('Updating video playback');
      final videoPlayback =
          VideoPlaybackValue.fromNativeController(controller.value!);
      ref.read(videoPlaybackValueProvider.notifier).value = videoPlayback;
      log.info('Updated video playback');

      // Check if the video is buffering
      if (videoPlayback.state == VideoPlaybackState.playing) {
        log.info('Updating video: checking if playing video is buffering');
        isBuffering.value =
            lastVideoPosition.value == videoPlayback.position.inSeconds;
        lastVideoPosition.value = videoPlayback.position.inSeconds;
        log.info('Updating playing video position');
      } else {
        log.info('Updating video: video is not playing');
        isBuffering.value = false;
        lastVideoPosition.value = -1;
        log.info('Updated non-playing video position');
      }
      final state = videoPlayback.state;

      // Enable the WakeLock while the video is playing
      if (state == VideoPlaybackState.playing) {
        log.info('Syncing with the controls playing');
        // Sync with the controls playing
        WakelockPlus.enable();
        log.info('Synced with the controls playing');
      } else {
        log.info('Syncing with the controls pause');
        // Sync with the controls pause
        WakelockPlus.disable();
        log.info('Synced with the controls pause');
      }
    }

    void onPlaybackEnded() {
      try {
        log.info('onPlaybackEnded: Video ended');
        if (loopVideo) {
          log.info('onPlaybackEnded: Looping video');
          controller.value?.play();
          log.info('onPlaybackEnded: Looped video');
        }
      } catch (error) {
        log.severe('Error looping video: $error');
        // Consume error from the controller
      }
    }

    Future<void> initController(NativeVideoPlayerController nc) async {
      if (controller.value != null) {
        log.info('initController: Controller already initialized');
        return;
      }

      log.info('initController: adding onPlaybackPositionChanged listener');
      nc.onPlaybackPositionChanged.addListener(onPlaybackPositionChanged);
      log.info('initController: added onPlaybackPositionChanged listener');

      log.info('initController: adding onPlaybackStatusChanged listener');
      nc.onPlaybackStatusChanged.addListener(onPlaybackPositionChanged);
      log.info('initController: added onPlaybackStatusChanged listener');

      log.info('initController: adding onPlaybackReady listener');
      nc.onPlaybackReady.addListener(onPlaybackReady);
      log.info('initController: added onPlaybackReady listener');

      log.info('initController: adding onPlaybackEnded listener');
      nc.onPlaybackEnded.addListener(onPlaybackEnded);
      log.info('initController: added onPlaybackEnded listener');

      log.info('initController: loading video source');
      nc.loadVideoSource(await videoSource);
      log.info('initController: loaded video source');

      log.info('initController: setting controller');
      controller.value = nc;
      log.info('initController: set controller');
      Timer(const Duration(milliseconds: 200), checkIfBuffering);
    }

    useEffect(
      () {
        log.info('useEffect: resetting video player controls');
        ref.read(videoPlayerControlsProvider.notifier).reset();
        log.info('useEffect: resetting video player controls');

        if (isMotionVideo) {
          // ignore: prefer-extracting-callbacks
          log.info('useEffect: disabled showing video player controls');
          ref.read(showControlsProvider.notifier).show = false;
          log.info('useEffect: disabled showing video player controls');
        }

        return () {
          try {
            final playerController = controller.value;
            if (playerController == null) {
              log.info('No controller to dispose');
              return;
            }
            log.info('Removing onPlaybackPositionChanged listener');
            playerController.onPlaybackPositionChanged
                .removeListener(onPlaybackPositionChanged);
            log.info('Removed onPlaybackPositionChanged listener');

            log.info('Removing onPlaybackStatusChanged listener');
            playerController.onPlaybackStatusChanged
                .removeListener(onPlaybackPositionChanged);
            log.info('Removed onPlaybackStatusChanged listener');

            log.info('Removing onPlaybackReady listener');
            playerController.onPlaybackReady.removeListener(onPlaybackReady);
            log.info('Removed onPlaybackReady listener');

            log.info('Removing onPlaybackEnded listener');
            playerController.onPlaybackEnded.removeListener(onPlaybackEnded);
            log.info('Removed onPlaybackEnded listener');

            Future.microtask(() async {
              log.info('Stopping video');
              await playerController.stop();
              log.info('Stopped video');

              log.info('Disabling wakelock');
              await WakelockPlus.disable();
              log.info('Disabled wakelock');
            });

            log.info('Disposing controller');
            controller.value = null;
            log.info('Disposed controller');
          } catch (error) {
            log.severe('Error during useEffect cleanup: $error');
            // Consume error from the controller
          }
        };
      },
      [],
    );

    return Stack(
      children: [
        Center(
          child: AspectRatio(
            aspectRatio: aspectRatio,
            child: NativeVideoPlayerView(
              onViewReady: initController,
            ),
          ),
        ),
        if (showControls)
          Center(
            child: CustomVideoPlayerControls(
              hideTimerDuration: hideControlsTimer,
            ),
          ),
        // Visibility(
        //   visible: controller.value == null,
        //   child: const Positioned.fill(
        //     child: Center(
        //       child: DelayedLoadingIndicator(
        //         fadeInDuration: Duration(milliseconds: 500),
        //       ),
        //     ),
        //   ),
        // ),
      ],
    );
  }
}
