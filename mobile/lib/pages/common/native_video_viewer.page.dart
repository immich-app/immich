import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart' hide Store;
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/providers/asset_viewer/show_controls.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_controls_provider.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_value_provider.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/services/asset.service.dart';
import 'package:immich_mobile/widgets/asset_viewer/custom_video_player_controls.dart';
import 'package:immich_mobile/widgets/common/delayed_loading_indicator.dart';
import 'package:native_video_player/native_video_player.dart';
import 'package:wakelock_plus/wakelock_plus.dart';

class NativeVideoViewerPage extends HookConsumerWidget {
  final Asset asset;
  final bool isMotionVideo;
  final Widget? placeholder;
  final bool showControls;
  final Duration hideControlsTimer;
  final bool loopVideo;

  const NativeVideoViewerPage({
    super.key,
    required this.asset,
    this.isMotionVideo = false,
    this.placeholder,
    this.showControls = true,
    this.hideControlsTimer = const Duration(seconds: 5),
    this.loopVideo = false,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final controller = useState<NativeVideoPlayerController?>(null);
    final lastVideoPosition = useRef(-1);
    final isBuffering = useRef(false);
    final width = useRef<double>(asset.width?.toDouble() ?? 1.0);
    final height = useRef<double>(asset.height?.toDouble() ?? 1.0);

    void checkIfBuffering([Timer? timer]) {
      if (!context.mounted) {
        timer?.cancel();
        return;
      }

      final videoPlayback = ref.read(videoPlaybackValueProvider);
      if ((isBuffering.value ||
              videoPlayback.state == VideoPlaybackState.initializing) &&
          videoPlayback.state != VideoPlaybackState.buffering) {
        ref.read(videoPlaybackValueProvider.notifier).value =
            videoPlayback.copyWith(state: VideoPlaybackState.buffering);
      }
    }

    // timer to mark videos as buffering if the position does not change
    final bufferingTimer = useRef<Timer>(
      Timer.periodic(const Duration(seconds: 5), checkIfBuffering),
    );

    Future<VideoSource> createSource(Asset asset) async {
      if (asset.isLocal && asset.livePhotoVideoId == null) {
        final entity = await asset.local!.obtainForNewProperties();
        final file = await entity?.file;
        if (entity == null || file == null) {
          throw Exception('No file found for the video');
        }

        width.value = entity.orientatedWidth.toDouble();
        height.value = entity.orientatedHeight.toDouble();

        return await VideoSource.init(
          path: file.path,
          type: VideoSourceType.file,
        );
      } else {
        final assetWithExif =
            await ref.read(assetServiceProvider).loadExif(asset);
        final shouldFlip = assetWithExif.exifInfo?.isFlipped ?? false;
        width.value = (shouldFlip ? assetWithExif.height : assetWithExif.width)
                ?.toDouble() ??
            width.value;
        height.value = (shouldFlip ? assetWithExif.width : assetWithExif.height)
                ?.toDouble() ??
            height.value;

        // Use a network URL for the video player controller
        final serverEndpoint = Store.get(StoreKey.serverEndpoint);
        final String videoUrl = asset.livePhotoVideoId != null
            ? '$serverEndpoint/assets/${asset.livePhotoVideoId}/video/playback'
            : '$serverEndpoint/assets/${asset.remoteId}/video/playback';

        return await VideoSource.init(
          path: videoUrl,
          type: VideoSourceType.network,
          headers: ApiService.getRequestHeaders(),
        );
      }
    }

    // When the volume changes, set the volume
    ref.listen(videoPlayerControlsProvider.select((value) => value.mute),
        (_, mute) {
      try {
        if (mute) {
          controller.value?.setVolume(0.0);
        } else {
          controller.value?.setVolume(0.7);
        }
      } catch (_) {
        // Consume error from the controller
      }
    });

    // When the position changes, seek to the position
    ref.listen(videoPlayerControlsProvider.select((value) => value.position),
        (_, position) {
      if (controller.value == null) {
        // No seeeking if there is no video
        return;
      }

      // Find the position to seek to
      final Duration seek = asset.duration * (position / 100.0);
      try {
        controller.value?.seekTo(seek.inSeconds);
      } catch (_) {
        // Consume error from the controller
      }
    });

    // When the custom video controls paus or plays
    ref.listen(videoPlayerControlsProvider.select((value) => value.pause),
        (_, pause) {
      try {
        if (pause) {
          controller.value?.pause();
        } else {
          controller.value?.play();
        }
      } catch (_) {
        // Consume error from the controller
      }
    });

    void updateVideoPlayback() {
      if (controller.value == null || !context.mounted) {
        return;
      }

      final videoPlayback =
          VideoPlaybackValue.fromNativeController(controller.value!);
      ref.read(videoPlaybackValueProvider.notifier).value = videoPlayback;
      // Check if the video is buffering
      if (videoPlayback.state == VideoPlaybackState.playing) {
        isBuffering.value =
            lastVideoPosition.value == videoPlayback.position.inSeconds;
        lastVideoPosition.value = videoPlayback.position.inSeconds;
      } else {
        isBuffering.value = false;
        lastVideoPosition.value = -1;
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

    void onPlaybackReady() {
      try {
        controller.value?.play();
        controller.value?.setVolume(0.9);
      } catch (_) {
        // Consume error from the controller
      }
    }

    void onPlaybackPositionChanged() {
      updateVideoPlayback();
    }

    void onPlaybackEnded() {
      try {
        if (loopVideo) {
          controller.value?.play();
        }
      } catch (_) {
        // Consume error from the controller
      }
    }

    Future<void> initController(NativeVideoPlayerController nc) async {
      if (controller.value != null) {
        return;
      }

      nc.onPlaybackPositionChanged.addListener(onPlaybackPositionChanged);
      nc.onPlaybackStatusChanged.addListener(onPlaybackPositionChanged);
      nc.onPlaybackReady.addListener(onPlaybackReady);
      nc.onPlaybackEnded.addListener(onPlaybackEnded);

      final videoSource = await createSource(asset);
      nc.loadVideoSource(videoSource);

      controller.value = nc;
      Timer(const Duration(milliseconds: 200), checkIfBuffering);
    }

    useEffect(
      () {
        Future.microtask(
          () => ref.read(videoPlayerControlsProvider.notifier).reset(),
        );

        if (isMotionVideo) {
          // ignore: prefer-extracting-callbacks
          Future.microtask(() {
            ref.read(showControlsProvider.notifier).show = false;
          });
        }

        return () {
          bufferingTimer.value.cancel();
          try {
            controller.value?.onPlaybackPositionChanged
                .removeListener(onPlaybackPositionChanged);
            controller.value?.onPlaybackStatusChanged
                .removeListener(onPlaybackPositionChanged);
            controller.value?.onPlaybackReady.removeListener(onPlaybackReady);
            controller.value?.onPlaybackEnded.removeListener(onPlaybackEnded);
            controller.value?.stop();
          } catch (_) {
            // Consume error from the controller
          }
        };
      },
      [],
    );

    double calculateAspectRatio() {
      if (width.value == 0 || height.value == 0) {
        return 1;
      }
      return width.value / height.value;
    }

    final size = MediaQuery.sizeOf(context);

    return SizedBox(
      height: size.height,
      width: size.width,
      child: GestureDetector(
        behavior: HitTestBehavior.deferToChild,
        child: PopScope(
          onPopInvokedWithResult: (didPop, _) => ref
              .read(videoPlaybackValueProvider.notifier)
              .value = VideoPlaybackValue.uninitialized(),
          child: SizedBox(
            height: size.height,
            width: size.width,
            child: Stack(
              children: [
                Center(
                  child: AspectRatio(
                    aspectRatio: calculateAspectRatio(),
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
                Visibility(
                  visible: controller.value == null,
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
              ],
            ),
          ),
        ),
      ),
    );
  }
}
