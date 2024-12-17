import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/asset_viewer/current_asset.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/show_controls.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_controls_provider.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_value_provider.dart';
import 'package:immich_mobile/utils/hooks/timer_hook.dart';
import 'package:immich_mobile/widgets/asset_viewer/center_play_button.dart';
import 'package:immich_mobile/widgets/common/delayed_loading_indicator.dart';

class CustomVideoPlayerControls extends HookConsumerWidget {
  final Duration hideTimerDuration;

  const CustomVideoPlayerControls({
    super.key,
    this.hideTimerDuration = const Duration(seconds: 5),
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final assetIsVideo = ref.watch(
      currentAssetProvider.select((asset) => asset != null && asset.isVideo),
    );
    final showControls = ref.watch(showControlsProvider);
    final VideoPlaybackState state =
        ref.watch(videoPlaybackValueProvider.select((value) => value.state));

    // A timer to hide the controls
    final hideTimer = useTimer(
      hideTimerDuration,
      () {
        if (!context.mounted) {
          return;
        }
        final state = ref.read(videoPlaybackValueProvider).state;

        // Do not hide on paused
        if (state != VideoPlaybackState.paused &&
            state != VideoPlaybackState.completed &&
            assetIsVideo) {
          ref.read(showControlsProvider.notifier).show = false;
        }
      },
    );
    final showBuffering = state == VideoPlaybackState.buffering;

    /// Shows the controls and starts the timer to hide them
    void showControlsAndStartHideTimer() {
      hideTimer.reset();
      ref.read(showControlsProvider.notifier).show = true;
    }

    // When we change position, show or hide timer
    ref.listen(videoPlayerControlsProvider.select((v) => v.position),
        (previous, next) {
      showControlsAndStartHideTimer();
    });

    /// Toggles between playing and pausing depending on the state of the video
    void togglePlay() {
      showControlsAndStartHideTimer();
      if (state == VideoPlaybackState.playing) {
        ref.read(videoPlayerControlsProvider.notifier).pause();
      } else if (state == VideoPlaybackState.completed) {
        ref.read(videoPlayerControlsProvider.notifier).restart();
      } else {
        ref.read(videoPlayerControlsProvider.notifier).play();
      }
    }

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: showControlsAndStartHideTimer,
      child: AbsorbPointer(
        absorbing: !showControls,
        child: Stack(
          children: [
            if (showBuffering)
              const Center(
                child: DelayedLoadingIndicator(
                  fadeInDuration: Duration(milliseconds: 400),
                ),
              )
            else
              GestureDetector(
                onTap: () =>
                    ref.read(showControlsProvider.notifier).show = false,
                child: CenterPlayButton(
                  backgroundColor: Colors.black54,
                  iconColor: Colors.white,
                  isFinished: state == VideoPlaybackState.completed,
                  isPlaying: state == VideoPlaybackState.playing,
                  show: assetIsVideo && showControls,
                  onPressed: togglePlay,
                ),
              ),
          ],
        ),
      ),
    );
  }
}
