import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/models/cast/cast_manager_state.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_provider.dart';
import 'package:immich_mobile/providers/cast.provider.dart';
import 'package:immich_mobile/utils/hooks/timer_hook.dart';
import 'package:immich_mobile/widgets/asset_viewer/center_play_button.dart';
import 'package:immich_mobile/widgets/common/delayed_loading_indicator.dart';

class VideoViewerControls extends HookConsumerWidget {
  final BaseAsset asset;
  final Duration hideTimerDuration;

  const VideoViewerControls({super.key, required this.asset, this.hideTimerDuration = const Duration(seconds: 5)});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final videoPlayerName = asset.heroTag;
    final assetIsVideo = asset.isVideo;
    final showControls = ref.watch(assetViewerProvider.select((s) => s.showingControls && !s.showingDetails));
    final status = ref.watch(videoPlayerProvider(videoPlayerName).select((value) => value.status));

    final cast = ref.watch(castProvider);

    // A timer to hide the controls
    final hideTimer = useTimer(hideTimerDuration, () {
      if (!context.mounted) {
        return;
      }
      final status = ref.read(videoPlayerProvider(videoPlayerName)).status;

      // Do not hide on paused
      if (status != VideoPlaybackStatus.paused && status != VideoPlaybackStatus.completed && assetIsVideo) {
        ref.read(assetViewerProvider.notifier).setControls(false);
      }
    });
    final showBuffering = status == VideoPlaybackStatus.buffering && !cast.isCasting;

    /// Shows the controls and starts the timer to hide them
    void showControlsAndStartHideTimer() {
      hideTimer.reset();
      ref.read(assetViewerProvider.notifier).setControls(true);
    }

    // When playback starts, reset the hide timer
    ref.listen(videoPlayerProvider(videoPlayerName).select((v) => v.status), (previous, next) {
      if (next == VideoPlaybackStatus.playing) {
        hideTimer.reset();
      }
    });

    /// Toggles between playing and pausing depending on the state of the video
    void togglePlay() {
      showControlsAndStartHideTimer();

      if (cast.isCasting) {
        switch (cast.castState) {
          case CastState.playing:
            ref.read(castProvider.notifier).pause();
          case CastState.paused:
            ref.read(castProvider.notifier).play();
          default:
        }
        return;
      }

      final notifier = ref.read(videoPlayerProvider(videoPlayerName).notifier);
      switch (status) {
        case VideoPlaybackStatus.playing:
          notifier.pause();
        case VideoPlaybackStatus.completed:
          notifier.restart();
        default:
          notifier.play();
      }
    }

    void toggleControlsVisibility() {
      if (showBuffering) return;

      if (showControls) {
        ref.read(assetViewerProvider.notifier).setControls(false);
      } else {
        showControlsAndStartHideTimer();
      }
    }

    return GestureDetector(
      behavior: HitTestBehavior.translucent,
      onTap: toggleControlsVisibility,
      child: IgnorePointer(
        ignoring: !showControls,
        child: Stack(
          children: [
            if (showBuffering)
              const Center(child: DelayedLoadingIndicator(fadeInDuration: Duration(milliseconds: 400)))
            else
              CenterPlayButton(
                backgroundColor: Colors.black54,
                iconColor: Colors.white,
                isFinished: status == VideoPlaybackStatus.completed,
                isPlaying:
                    status == VideoPlaybackStatus.playing || (cast.isCasting && cast.castState == CastState.playing),
                show: assetIsVideo && showControls,
                onPressed: togglePlay,
              ),
          ],
        ),
      ),
    );
  }
}
