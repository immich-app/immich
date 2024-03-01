import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/asset_viewer/providers/show_controls.provider.dart';
import 'package:immich_mobile/modules/asset_viewer/providers/video_player_controls_provider.dart';
import 'package:immich_mobile/modules/asset_viewer/providers/video_player_value_provider.dart';
import 'package:immich_mobile/modules/asset_viewer/ui/center_play_button.dart';
import 'package:immich_mobile/shared/ui/delayed_loading_indicator.dart';
import 'package:immich_mobile/shared/ui/hooks/timer_hook.dart';

class CustomVideoPlayerControls extends HookConsumerWidget {
  final Duration hideTimerDuration;

  const CustomVideoPlayerControls({
    super.key,
    this.hideTimerDuration = const Duration(seconds: 3),
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // A timer to hide the controls
    final hideTimer = useTimer(
      hideTimerDuration,
      () {
        ref.read(showControlsProvider.notifier).show = false;
      },
    );

    final showBuffering = useState(false);
    final VideoPlaybackState state =
        ref.watch(videoPlaybackValueProvider).state;

    /// Shows the controls and starts the timer to hide them
    void showControlsAndStartHideTimer() {
      hideTimer.reset();
      ref.read(showControlsProvider.notifier).show = true;
    }

    // When we mute, show the controls
    ref.listen(videoPlayerControlsProvider.select((v) => v.mute),
        (previous, next) {
      showControlsAndStartHideTimer();
    });

    // When we change position, show or hide timer
    ref.listen(videoPlayerControlsProvider.select((v) => v.position),
        (previous, next) {
      showControlsAndStartHideTimer();
    });

    ref.listen(videoPlaybackValueProvider.select((value) => value.state),
        (_, state) {
      // Show buffering
      showBuffering.value = state == VideoPlaybackState.buffering;

      // Synchronize player with video state
      if (state == VideoPlaybackState.playing) {
        ref.read(videoPlayerControlsProvider.notifier).play();
      } else if (state == VideoPlaybackState.paused) {
        ref.read(videoPlayerControlsProvider.notifier).pause();
      }
    });

    /// Toggles between playing and pausing depending on the state of the video
    void togglePlay() {
      showControlsAndStartHideTimer();
      ref.read(videoPlayerControlsProvider.notifier).togglePlay();
    }

    return GestureDetector(
      onTap: () => showControlsAndStartHideTimer(),
      child: AbsorbPointer(
        absorbing: !ref.watch(showControlsProvider),
        child: Stack(
          children: [
            if (showBuffering.value)
              const Center(
                child: DelayedLoadingIndicator(
                  fadeInDuration: Duration(milliseconds: 400),
                ),
              ),
            GestureDetector(
              onTap: () {
                if (state != VideoPlaybackState.playing) {
                  togglePlay();
                }
              },
              child: CenterPlayButton(
                backgroundColor: Colors.black54,
                iconColor: Colors.white,
                isFinished: state == VideoPlaybackState.completed,
                isPlaying: state == VideoPlaybackState.playing,
                show: ref.watch(showControlsProvider),
                onPressed: togglePlay,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
