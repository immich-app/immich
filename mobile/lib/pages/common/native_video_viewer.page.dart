import 'dart:async';
import 'dart:io';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart' hide Store;
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/current_asset.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/is_motion_video_playing.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_controls_provider.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_value_provider.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/services/asset.service.dart';
import 'package:immich_mobile/utils/debounce.dart';
import 'package:immich_mobile/utils/hooks/interval_hook.dart';
import 'package:immich_mobile/widgets/asset_viewer/custom_video_player_controls.dart';
import 'package:logging/logging.dart';
import 'package:native_video_player/native_video_player.dart';
import 'package:wakelock_plus/wakelock_plus.dart';

@RoutePage()
class NativeVideoViewerPage extends HookConsumerWidget {
  final Asset asset;
  final bool showControls;
  final int playbackDelayFactor;
  final Widget image;

  const NativeVideoViewerPage({
    super.key,
    required this.asset,
    required this.image,
    this.showControls = true,
    this.playbackDelayFactor = 1,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final controller = useState<NativeVideoPlayerController?>(null);
    final lastVideoPosition = useRef(-1);
    final isBuffering = useRef(false);

    // When a video is opened through the timeline, `isCurrent` will immediately be true.
    // When swiping from video A to video B, `isCurrent` will initially be true for video A and false for video B.
    // If the swipe is completed, `isCurrent` will be true for video B after a delay.
    // If the swipe is canceled, `currentAsset` will not have changed and video A will continue to play.
    final currentAsset = useState(ref.read(currentAssetProvider));
    final isCurrent = currentAsset.value == asset;

    // Used to show the placeholder during hero animations for remote videos to avoid a stutter
    final isVisible = useState(Platform.isIOS && asset.isLocal);

    final log = Logger('NativeVideoViewerPage');

    Future<VideoSource?> createSource() async {
      if (!context.mounted) {
        return null;
      }

      try {
        final local = asset.local;
        if (local != null && asset.livePhotoVideoId == null) {
          final file = await local.file;
          if (file == null) {
            throw Exception('No file found for the video');
          }

          final source = await VideoSource.init(
            path: file.path,
            type: VideoSourceType.file,
          );
          return source;
        }

        // Use a network URL for the video player controller
        final serverEndpoint = Store.get(StoreKey.serverEndpoint);
        final isOriginalVideo = ref
            .read(appSettingsServiceProvider)
            .getSetting<bool>(AppSettingsEnum.loadOriginalVideo);
        final String postfixUrl =
            isOriginalVideo ? 'original' : 'video/playback';
        final String videoUrl = asset.livePhotoVideoId != null
            ? '$serverEndpoint/assets/${asset.livePhotoVideoId}/$postfixUrl'
            : '$serverEndpoint/assets/${asset.remoteId}/$postfixUrl';

        final source = await VideoSource.init(
          path: videoUrl,
          type: VideoSourceType.network,
          headers: ApiService.getRequestHeaders(),
        );
        return source;
      } catch (error) {
        log.severe(
          'Error creating video source for asset ${asset.fileName}: $error',
        );
        return null;
      }
    }

    final videoSource = useMemoized<Future<VideoSource?>>(() => createSource());
    final aspectRatio = useState<double?>(asset.aspectRatio);
    useMemoized(
      () async {
        if (!context.mounted || aspectRatio.value != null) {
          return null;
        }

        try {
          aspectRatio.value =
              await ref.read(assetServiceProvider).getAspectRatio(asset);
        } catch (error) {
          log.severe(
            'Error getting aspect ratio for asset ${asset.fileName}: $error',
          );
        }
      },
    );

    void checkIfBuffering() {
      if (!context.mounted) {
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

    // Timer to mark videos as buffering if the position does not change
    useInterval(const Duration(seconds: 5), checkIfBuffering);

    // When the position changes, seek to the position
    // Debounce the seek to avoid seeking too often
    // But also don't delay the seek too much to maintain visual feedback
    final seekDebouncer = useDebouncer(
      interval: const Duration(milliseconds: 100),
      maxWaitTime: const Duration(milliseconds: 200),
    );
    ref.listen(videoPlayerControlsProvider, (oldControls, newControls) async {
      final playerController = controller.value;
      if (playerController == null) {
        return;
      }

      final playbackInfo = playerController.playbackInfo;
      if (playbackInfo == null) {
        return;
      }

      final oldSeek = (oldControls?.position ?? 0) ~/ 1;
      final newSeek = newControls.position ~/ 1;
      if (oldSeek != newSeek || newControls.restarted) {
        seekDebouncer.run(() => playerController.seekTo(newSeek));
      }

      if (oldControls?.pause != newControls.pause || newControls.restarted) {
        // Make sure the last seek is complete before pausing or playing
        // Otherwise, `onPlaybackPositionChanged` can receive outdated events
        if (seekDebouncer.isActive) {
          await seekDebouncer.drain();
        }

        try {
          if (newControls.pause) {
            await playerController.pause();
          } else {
            await playerController.play();
          }
        } catch (error) {
          log.severe('Error pausing or playing video: $error');
        }
      }
    });

    void onPlaybackReady() async {
      final videoController = controller.value;
      if (videoController == null || !isCurrent || !context.mounted) {
        return;
      }

      final videoPlayback =
          VideoPlaybackValue.fromNativeController(videoController);
      ref.read(videoPlaybackValueProvider.notifier).value = videoPlayback;

      try {
        await videoController.play();
        await videoController.setVolume(0.9);
      } catch (error) {
        log.severe('Error playing video: $error');
      }
    }

    void onPlaybackStatusChanged() {
      final videoController = controller.value;
      if (videoController == null || !context.mounted) {
        return;
      }

      final videoPlayback =
          VideoPlaybackValue.fromNativeController(videoController);
      if (videoPlayback.state == VideoPlaybackState.playing) {
        // Sync with the controls playing
        WakelockPlus.enable();
      } else {
        // Sync with the controls pause
        WakelockPlus.disable();
      }

      ref.read(videoPlaybackValueProvider.notifier).status =
          videoPlayback.state;
    }

    void onPlaybackPositionChanged() {
      // When seeking, these events sometimes move the slider to an older position
      if (seekDebouncer.isActive) {
        return;
      }

      final videoController = controller.value;
      if (videoController == null || !context.mounted) {
        return;
      }

      final playbackInfo = videoController.playbackInfo;
      if (playbackInfo == null) {
        return;
      }

      ref.read(videoPlaybackValueProvider.notifier).position =
          Duration(seconds: playbackInfo.position);

      // Check if the video is buffering
      if (playbackInfo.status == PlaybackStatus.playing) {
        isBuffering.value = lastVideoPosition.value == playbackInfo.position;
        lastVideoPosition.value = playbackInfo.position;
      } else {
        isBuffering.value = false;
        lastVideoPosition.value = -1;
      }
    }

    void onPlaybackEnded() {
      final videoController = controller.value;
      if (videoController == null || !context.mounted) {
        return;
      }

      if (videoController.playbackInfo?.status == PlaybackStatus.stopped &&
          !ref
              .read(appSettingsServiceProvider)
              .getSetting<bool>(AppSettingsEnum.loopVideo)) {
        ref.read(isPlayingMotionVideoProvider.notifier).playing = false;
      }
    }

    void removeListeners(NativeVideoPlayerController controller) {
      controller.onPlaybackPositionChanged
          .removeListener(onPlaybackPositionChanged);
      controller.onPlaybackStatusChanged
          .removeListener(onPlaybackStatusChanged);
      controller.onPlaybackReady.removeListener(onPlaybackReady);
      controller.onPlaybackEnded.removeListener(onPlaybackEnded);
    }

    void initController(NativeVideoPlayerController nc) async {
      if (controller.value != null || !context.mounted) {
        return;
      }
      ref.read(videoPlayerControlsProvider.notifier).reset();
      ref.read(videoPlaybackValueProvider.notifier).reset();

      final source = await videoSource;
      if (source == null) {
        return;
      }

      nc.onPlaybackPositionChanged.addListener(onPlaybackPositionChanged);
      nc.onPlaybackStatusChanged.addListener(onPlaybackStatusChanged);
      nc.onPlaybackReady.addListener(onPlaybackReady);
      nc.onPlaybackEnded.addListener(onPlaybackEnded);

      nc.loadVideoSource(source).catchError((error) {
        log.severe('Error loading video source: $error');
      });
      final loopVideo = ref
          .read(appSettingsServiceProvider)
          .getSetting<bool>(AppSettingsEnum.loopVideo);
      nc.setLoop(loopVideo);

      controller.value = nc;
      Timer(const Duration(milliseconds: 200), checkIfBuffering);
    }

    ref.listen(currentAssetProvider, (_, value) {
      final playerController = controller.value;
      if (playerController != null && value != asset) {
        removeListeners(playerController);
      }

      final curAsset = currentAsset.value;
      if (curAsset == asset) {
        return;
      }

      final imageToVideo = curAsset != null && !curAsset.isVideo;

      // No need to delay video playback when swiping from an image to a video
      if (imageToVideo && Platform.isIOS) {
        currentAsset.value = value;
        onPlaybackReady();
        return;
      }

      // Delay the video playback to avoid a stutter in the swipe animation
      // Note, in some circumstances a longer delay is needed (eg: memories),
      // the playbackDelayFactor can be used for this
      // This delay seems like a hacky way to resolve underlying bugs in video
      // playback, but other resolutions failed thus far
      Timer(
          Platform.isIOS
              ? Duration(milliseconds: 300 * playbackDelayFactor)
              : imageToVideo
                  ? Duration(milliseconds: 200 * playbackDelayFactor)
                  : Duration(milliseconds: 400 * playbackDelayFactor), () {
        if (!context.mounted) {
          return;
        }

        currentAsset.value = value;
        if (currentAsset.value == asset) {
          onPlaybackReady();
        }
      });
    });

    useEffect(
      () {
        // If opening a remote video from a hero animation, delay visibility to avoid a stutter
        final timer = isVisible.value
            ? null
            : Timer(
                const Duration(milliseconds: 300),
                () => isVisible.value = true,
              );

        return () {
          timer?.cancel();
          final playerController = controller.value;
          if (playerController == null) {
            return;
          }
          removeListeners(playerController);
          playerController.stop().catchError((error) {
            log.fine('Error stopping video: $error');
          });

          WakelockPlus.disable();
        };
      },
      const [],
    );

    return Stack(
      children: [
        // This remains under the video to avoid flickering
        // For motion videos, this is the image portion of the asset
        Center(key: ValueKey(asset.id), child: image),
        if (aspectRatio.value != null)
          Visibility.maintain(
            key: ValueKey(asset),
            visible: isVisible.value,
            child: Center(
              key: ValueKey(asset),
              child: AspectRatio(
                key: ValueKey(asset),
                aspectRatio: aspectRatio.value!,
                child: isCurrent
                    ? NativeVideoPlayerView(
                        key: ValueKey(asset),
                        onViewReady: initController,
                      )
                    : null,
              ),
            ),
          ),
        if (showControls) const Center(child: CustomVideoPlayerControls()),
      ],
    );
  }
}
