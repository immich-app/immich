import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/cast/cast_manager_state.dart';
import 'package:immich_mobile/providers/asset_viewer/current_asset.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/show_controls.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_provider.dart';
import 'package:immich_mobile/providers/cast.provider.dart';
import 'package:immich_mobile/utils/hooks/timer_hook.dart';
import 'package:immich_mobile/widgets/asset_viewer/center_play_button.dart';
import 'package:immich_mobile/widgets/common/delayed_loading_indicator.dart';

class CustomVideoPlayerControls extends HookConsumerWidget {
  final String videoId;
  final Duration hideTimerDuration;

  const CustomVideoPlayerControls({
    super.key,
    required this.videoId,
    this.hideTimerDuration = const Duration(seconds: 5),
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final assetIsVideo = ref.watch(currentAssetProvider.select((asset) => asset != null && asset.isVideo));
    final showControls = ref.watch(showControlsProvider);
    final status = ref.watch(videoPlayerProvider(videoId).select((value) => value.status));

    final cast = ref.watch(castProvider);

    // A timer to hide the controls
    final hideTimer = useTimer(hideTimerDuration, () {
      if (!context.mounted) {
        return;
      }
      final s = ref.read(videoPlayerProvider(videoId)).status;

      // Do not hide on paused
      if (s != VideoPlaybackStatus.paused && s != VideoPlaybackStatus.completed && assetIsVideo) {
        ref.read(showControlsProvider.notifier).show = false;
      }
    });
    final showBuffering = status == VideoPlaybackStatus.buffering && !cast.isCasting;

    /// Shows the controls and starts the timer to hide them
    void showControlsAndStartHideTimer() {
      hideTimer.reset();
      ref.read(showControlsProvider.notifier).show = true;
    }

    // When playback starts, reset the hide timer
    ref.listen(videoPlayerProvider(videoId).select((v) => v.status), (previous, next) {
      if (next == VideoPlaybackStatus.playing) {
        hideTimer.reset();
      }
    });

    /// Toggles between playing and pausing depending on the state of the video
    void togglePlay() {
      showControlsAndStartHideTimer();

      if (cast.isCasting) {
        if (cast.castState == CastState.playing) {
          ref.read(castProvider.notifier).pause();
        } else if (cast.castState == CastState.paused) {
          ref.read(castProvider.notifier).play();
        } else if (cast.castState == CastState.idle) {
          // resend the play command since its finished
          final asset = ref.read(currentAssetProvider);
          if (asset == null) {
            return;
          }
          ref.read(castProvider.notifier).loadMediaOld(asset, true);
        }
        return;
      }

      final notifier = ref.read(videoPlayerProvider(videoId).notifier);
      if (status == VideoPlaybackStatus.playing) {
        notifier.pause();
      } else if (status == VideoPlaybackStatus.completed) {
        notifier.restart();
      } else {
        notifier.play();
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
              const Center(child: DelayedLoadingIndicator(fadeInDuration: Duration(milliseconds: 400)))
            else
              GestureDetector(
                onTap: () => ref.read(showControlsProvider.notifier).show = false,
                child: CenterPlayButton(
                  backgroundColor: Colors.black54,
                  iconColor: Colors.white,
                  isFinished: status == VideoPlaybackStatus.completed,
                  isPlaying:
                      status == VideoPlaybackStatus.playing || (cast.isCasting && cast.castState == CastState.playing),
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
