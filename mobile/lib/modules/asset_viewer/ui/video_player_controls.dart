import 'dart:async';

import 'package:chewie/chewie.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/asset_viewer/providers/show_controls.provider.dart';
import 'package:immich_mobile/modules/asset_viewer/providers/video_player_controls_provider.dart';
import 'package:immich_mobile/modules/asset_viewer/providers/video_player_value_provider.dart';
import 'package:immich_mobile/modules/asset_viewer/ui/center_play_button.dart';
import 'package:immich_mobile/shared/ui/delayed_loading_indicator.dart';
import 'package:video_player/video_player.dart';

class VideoPlayerControls extends ConsumerStatefulWidget {
  const VideoPlayerControls({
    super.key,
  });

  @override
  VideoPlayerControlsState createState() => VideoPlayerControlsState();
}

class VideoPlayerControlsState extends ConsumerState<VideoPlayerControls>
    with SingleTickerProviderStateMixin {
  late VideoPlayerController controller;
  late VideoPlayerValue _latestValue;
  bool _displayBufferingIndicator = false;
  double? _latestVolume;
  Timer? _hideTimer;

  ChewieController? _chewieController;
  ChewieController get chewieController => _chewieController!;

  @override
  Widget build(BuildContext context) {
    ref.listen(videoPlayerControlsProvider.select((value) => value.mute),
        (_, value) {
      _mute(value);
      _cancelAndRestartTimer();
    });

    ref.listen(videoPlayerControlsProvider.select((value) => value.position),
        (_, position) {
      _seekTo(position);
      _cancelAndRestartTimer();
    });

    if (_latestValue.hasError) {
      return chewieController.errorBuilder?.call(
            context,
            chewieController.videoPlayerController.value.errorDescription!,
          ) ??
          const Center(
            child: Icon(
              Icons.error,
              color: Colors.white,
              size: 42,
            ),
          );
    }

    return GestureDetector(
      onTap: () => _cancelAndRestartTimer(),
      child: AbsorbPointer(
        absorbing: !ref.watch(showControlsProvider),
        child: Stack(
          children: [
            if (_displayBufferingIndicator)
              const Center(
                child: DelayedLoadingIndicator(
                  fadeInDuration: Duration(milliseconds: 400),
                ),
              )
            else
              _buildHitArea(),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _dispose();

    super.dispose();
  }

  void _dispose() {
    controller.removeListener(_updateState);
    _hideTimer?.cancel();
  }

  @override
  void didChangeDependencies() {
    final oldController = _chewieController;
    _chewieController = ChewieController.of(context);
    controller = chewieController.videoPlayerController;
    _latestValue = controller.value;

    if (oldController != chewieController) {
      _dispose();
      _initialize();
    }

    super.didChangeDependencies();
  }

  Widget _buildHitArea() {
    final bool isFinished = _latestValue.position >= _latestValue.duration;

    return GestureDetector(
      onTap: () {
        if (!_latestValue.isPlaying) {
          _playPause();
        }
        ref.read(showControlsProvider.notifier).show = false;
      },
      child: CenterPlayButton(
        backgroundColor: Colors.black54,
        iconColor: Colors.white,
        isFinished: isFinished,
        isPlaying: controller.value.isPlaying,
        show: ref.watch(showControlsProvider),
        onPressed: _playPause,
      ),
    );
  }

  void _cancelAndRestartTimer() {
    _hideTimer?.cancel();
    _startHideTimer();
    ref.read(showControlsProvider.notifier).show = true;
  }

  Future<void> _initialize() async {
    ref.read(showControlsProvider.notifier).show = false;
    _mute(ref.read(videoPlayerControlsProvider.select((value) => value.mute)));

    _latestValue = controller.value;
    controller.addListener(_updateState);

    if (controller.value.isPlaying || chewieController.autoPlay) {
      _startHideTimer();
    }
  }

  void _playPause() {
    final isFinished = _latestValue.position >= _latestValue.duration;

    setState(() {
      if (controller.value.isPlaying) {
        ref.read(showControlsProvider.notifier).show = true;
        _hideTimer?.cancel();
        controller.pause();
      } else {
        _cancelAndRestartTimer();

        if (!controller.value.isInitialized) {
          controller.initialize().then((_) {
            controller.play();
          });
        } else {
          if (isFinished) {
            controller.seekTo(Duration.zero);
          }
          controller.play();
        }
      }
    });
  }

  void _startHideTimer() {
    final hideControlsTimer = chewieController.hideControlsTimer;
    _hideTimer?.cancel();
    _hideTimer = Timer(hideControlsTimer, () {
      ref.read(showControlsProvider.notifier).show = false;
    });
  }

  void _updateState() {
    if (!mounted) return;

    _displayBufferingIndicator = controller.value.isBuffering;

    setState(() {
      _latestValue = controller.value;
      ref.read(videoPlaybackValueProvider.notifier).value = VideoPlaybackValue(
        position: _latestValue.position,
        duration: _latestValue.duration,
      );
    });
  }

  void _mute(bool mute) {
    if (mute) {
      _latestVolume = controller.value.volume;
      controller.setVolume(0);
    } else {
      controller.setVolume(_latestVolume ?? 0.5);
    }
  }

  void _seekTo(double position) {
    final Duration pos = controller.value.duration * (position / 100.0);
    if (pos != controller.value.position) {
      controller.seekTo(pos);
    }
  }
}
