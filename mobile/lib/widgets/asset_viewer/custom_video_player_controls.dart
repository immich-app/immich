import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/asset_viewer/show_controls.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_controls_provider.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_value_provider.dart';
import 'package:immich_mobile/widgets/asset_viewer/center_play_button.dart';
import 'package:immich_mobile/widgets/common/delayed_loading_indicator.dart';
import 'package:immich_mobile/utils/hooks/timer_hook.dart';

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
        final state = ref.read(videoPlaybackValueProvider).state;
        // Do not hide on paused
        if (state != VideoPlaybackState.paused) {
          ref.read(showControlsProvider.notifier).show = false;
        }
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
    });

    /// Toggles between playing and pausing depending on the state of the video
    void togglePlay() {
      showControlsAndStartHideTimer();
      final state = ref.read(videoPlaybackValueProvider).state;
      if (state == VideoPlaybackState.playing) {
        ref.read(videoPlayerControlsProvider.notifier).pause();
      } else {
        ref.read(videoPlayerControlsProvider.notifier).play();
      }
    }

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: showControlsAndStartHideTimer,
      child: AbsorbPointer(
        absorbing: !ref.watch(showControlsProvider),
        child: Stack(
          children: [
            if (showBuffering.value)
              const Center(
                child: DelayedLoadingIndicator(
                  fadeInDuration: Duration(milliseconds: 400),
                ),
              )
            else
              GestureDetector(
                onTap: () {
                  if (state != VideoPlaybackState.playing) {
                    togglePlay();
                  }
                  ref.read(showControlsProvider.notifier).show = false;
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
