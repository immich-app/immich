import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart' hide Store;
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/providers/asset_viewer/show_controls.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_controls_provider.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_value_provider.dart';
import 'package:immich_mobile/services/api.service.dart';
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

    Future<VideoSource> createSource(Asset asset) async {
      if (asset.isLocal && asset.livePhotoVideoId == null) {
        final file = await asset.local!.file;
        if (file == null) {
          throw Exception('No file found for the video');
        }
        return await VideoSource.init(
          path: file.path,
          type: VideoSourceType.file,
        );
      } else {
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
      if (mute) {
        controller.value?.setVolume(0.0);
      } else {
        controller.value?.setVolume(0.7);
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
      controller.value?.seekTo(seek.inSeconds);
    });

    // When the custom video controls paus or plays
    ref.listen(videoPlayerControlsProvider.select((value) => value.pause),
        (_, pause) {
      if (pause) {
        controller.value?.pause();
      } else {
        controller.value?.play();
      }
    });

    void updateVideoPlayback() {
      if (controller.value == null || !context.mounted) {
        return;
      }

      final videoPlayback =
          VideoPlaybackValue.fromNativeController(controller.value!);
      ref.read(videoPlaybackValueProvider.notifier).value = videoPlayback;
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
      controller.value?.play();
    }

    void onPlaybackPositionChanged() {
      updateVideoPlayback();
    }

    void onPlaybackEnded() {
      if (loopVideo) {
        controller.value?.play();
      }
    }

    Future<void> initController(NativeVideoPlayerController nc) async {
      if (controller.value != null) {
        return;
      }

      controller.value = nc;

      controller.value?.onPlaybackPositionChanged
          .addListener(onPlaybackPositionChanged);
      controller.value?.onPlaybackStatusChanged
          .addListener(onPlaybackPositionChanged);
      controller.value?.onPlaybackReady.addListener(onPlaybackReady);
      controller.value?.onPlaybackEnded.addListener(onPlaybackEnded);

      final videoSource = await createSource(asset);
      controller.value?.loadVideoSource(videoSource);
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
          controller.value?.onPlaybackPositionChanged
              .removeListener(onPlaybackPositionChanged);
          controller.value?.onPlaybackStatusChanged
              .removeListener(onPlaybackPositionChanged);
          controller.value?.onPlaybackReady.removeListener(onPlaybackReady);
          controller.value?.onPlaybackEnded.removeListener(onPlaybackEnded);
        };
      },
      [],
    );

    void updatePlayback(VideoPlaybackValue value) =>
        ref.read(videoPlaybackValueProvider.notifier).value = value;

    final size = MediaQuery.sizeOf(context);

    return SizedBox(
      height: size.height,
      width: size.width,
      child: GestureDetector(
        behavior: HitTestBehavior.deferToChild,
        child: PopScope(
          onPopInvokedWithResult: (didPop, _) =>
              updatePlayback(VideoPlaybackValue.uninitialized()),
          child: SizedBox(
            height: size.height,
            width: size.width,
            child: Stack(
              children: [
                Center(
                  child: AspectRatio(
                    aspectRatio: (asset.width ?? 1) / (asset.height ?? 1),
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
