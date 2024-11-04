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

class NativeVideoViewerPage extends HookConsumerWidget {
  final VideoSource videoSource;
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

      final playbackInfo = playerController.playbackInfo;
      if (playbackInfo == null) {
        log.info('No playback info to update');
        return;
      }

      try {
        if (mute && playbackInfo.volume != 0.0) {
          log.info('Muting video');
          playerController.setVolume(0.0);
        } else if (!mute && playbackInfo.volume != 0.7) {
          log.info('Unmuting video');
          playerController.setVolume(0.7);
        }
      } catch (error) {
        log.severe('Error setting volume: $error');
      }
    });

    // When the position changes, seek to the position
    ref.listen(videoPlayerControlsProvider.select((value) => value.position),
        (_, position) {
      final playerController = controller.value;
      if (playerController == null) {
        log.info('No controller to seek to');
        return;
      }

      final playbackInfo = playerController.playbackInfo;
      if (playbackInfo == null) {
        log.info('No playback info to update');
        return;
      }

      // Find the position to seek to
      final int seek = (duration * (position / 100.0)).inSeconds;
      if (seek != playbackInfo.position) {
        log.info('Seeking to position: $seek from ${playbackInfo.position}');
        try {
          playerController.seekTo(seek);
        } catch (error) {
          log.severe('Error seeking to position $position: $error');
        }
      }

      ref.read(videoPlaybackValueProvider.notifier).position =
          Duration(seconds: seek);
    });

    // // When the custom video controls pause or play
    ref.listen(videoPlayerControlsProvider.select((value) => value.pause),
        (_, pause) {
      try {
        if (pause) {
          log.info('Pausing video');
          controller.value?.pause();
          WakelockPlus.disable();
        } else {
          log.info('Playing video');
          controller.value?.play();
          WakelockPlus.enable();
        }
      } catch (error) {
        log.severe('Error pausing or playing video: $error');
      }
    });

    void onPlaybackReady() {
      try {
        log.info('onPlaybackReady: Playing video');
        controller.value?.play();
        controller.value?.setVolume(0.9);
        WakelockPlus.enable();
      } catch (error) {
        log.severe('Error playing video: $error');
      }
    }

    void onPlaybackStatusChanged() {
      final videoController = controller.value;
      if (videoController == null || !context.mounted) {
        log.info('No controller to update');
        return;
      }

      final videoPlayback =
          VideoPlaybackValue.fromNativeController(controller.value!);
      ref.read(videoPlaybackValueProvider.notifier).value = videoPlayback;

      if (videoPlayback.state == VideoPlaybackState.playing) {
        // Sync with the controls playing
        WakelockPlus.enable();
        log.info('Video is playing; enabled wakelock');
      } else {
        // Sync with the controls pause
        WakelockPlus.disable();
        log.info('Video is not playing; disabled wakelock');
      }
    }

    void onPlaybackPositionChanged() {
      final videoController = controller.value;
      if (videoController == null || !context.mounted) {
        log.info('No controller to update');
        return;
      }

      final playbackInfo = videoController.playbackInfo;
      if (playbackInfo == null) {
        log.info('No playback info to update');
        return;
      }

      ref.read(videoPlaybackValueProvider.notifier).position =
          Duration(seconds: playbackInfo.position);

      // Check if the video is buffering
      if (playbackInfo.status == PlaybackStatus.playing) {
        log.info('Updating playing video position');
        isBuffering.value = lastVideoPosition.value == playbackInfo.position;
        lastVideoPosition.value = playbackInfo.position;
      } else {
        log.info('Updating non-playing video position');
        isBuffering.value = false;
        lastVideoPosition.value = -1;
      }
    }

    void onPlaybackEnded() {
      log.info('onPlaybackEnded: Video ended');
      if (loopVideo) {
        log.info('onPlaybackEnded: Looping video');
        try {
          controller.value?.play();
        } catch (error) {
          log.severe('Error looping video: $error');
        }
      } else {
        WakelockPlus.disable();
      }
    }

    void initController(NativeVideoPlayerController nc) {
      if (controller.value != null) {
        log.info('initController: Controller already initialized');
        return;
      }

      log.info('initController: adding onPlaybackPositionChanged listener');
      nc.onPlaybackPositionChanged.addListener(onPlaybackPositionChanged);

      log.info('initController: adding onPlaybackStatusChanged listener');
      nc.onPlaybackStatusChanged.addListener(onPlaybackStatusChanged);

      log.info('initController: adding onPlaybackReady listener');
      nc.onPlaybackReady.addListener(onPlaybackReady);

      log.info('initController: adding onPlaybackEnded listener');
      nc.onPlaybackEnded.addListener(onPlaybackEnded);

      log.info('initController: loading video source');
      nc.loadVideoSource(videoSource);

      log.info('initController: setting controller');
      controller.value = nc;
      Timer(const Duration(milliseconds: 200), checkIfBuffering);
    }

    useEffect(
      () {
        log.info('useEffect: resetting video player controls');
        ref.read(videoPlayerControlsProvider.notifier).reset();

        if (isMotionVideo) {
          // ignore: prefer-extracting-callbacks
          log.info('useEffect: disabling showing video player controls');
          ref.read(showControlsProvider.notifier).show = false;
        }

        return () {
          final playerController = controller.value;
          if (playerController == null) {
            log.info('No controller to dispose');
            return;
          }
          try {
            log.info('Stopping video');
            playerController.stop();

            log.info('Removing onPlaybackPositionChanged listener');
            playerController.onPlaybackPositionChanged
                .removeListener(onPlaybackPositionChanged);

            log.info('Removing onPlaybackStatusChanged listener');
            playerController.onPlaybackStatusChanged
                .removeListener(onPlaybackStatusChanged);

            log.info('Removing onPlaybackReady listener');
            playerController.onPlaybackReady.removeListener(onPlaybackReady);

            log.info('Removing onPlaybackEnded listener');
            playerController.onPlaybackEnded.removeListener(onPlaybackEnded);
          } catch (error) {
            log.severe('Error during useEffect cleanup: $error');
          }

          log.info('Disposing controller');
          controller.value = null;

          log.info('Disabling Wakelock');
          WakelockPlus.disable();
        };
      },
      [videoSource],
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
