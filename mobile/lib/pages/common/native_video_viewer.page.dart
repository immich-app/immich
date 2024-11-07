import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart' hide Store;
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/current_asset.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_controls_provider.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_value_provider.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/services/asset.service.dart';
import 'package:immich_mobile/utils/hooks/interval_hook.dart';
import 'package:immich_mobile/utils/throttle.dart';
import 'package:immich_mobile/widgets/asset_viewer/custom_video_player_controls.dart';
import 'package:logging/logging.dart';
import 'package:native_video_player/native_video_player.dart';
import 'package:wakelock_plus/wakelock_plus.dart';

class NativeVideoViewerPage extends HookConsumerWidget {
  final Asset asset;
  final bool showControls;
  final Duration hideControlsTimer;
  final Widget placeholder;

  const NativeVideoViewerPage({
    super.key,
    required this.asset,
    required this.placeholder,
    this.showControls = true,
    this.hideControlsTimer = const Duration(seconds: 5),
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final loopVideo = ref.watch(
      appSettingsServiceProvider.select(
        (settings) => settings.getSetting<bool>(AppSettingsEnum.loopVideo),
      ),
    );
    final controller = useState<NativeVideoPlayerController?>(null);
    final lastVideoPosition = useRef(-1);
    final isBuffering = useRef(false);
    final currentAsset = useState(ref.read(currentAssetProvider));
    final isCurrent = currentAsset.value == asset;

    final log = Logger('NativeVideoViewerPage');

    final localEntity = useMemoized(() {
      if (!asset.isLocal) {
        return null;
      }

      final local = asset.local;
      if (local == null || local.orientation > 0) {
        return Future.value(local);
      }

      return local.obtainForNewProperties();
    });

    Future<double?> calculateAspectRatio() async {
      if (!context.mounted) {
        return null;
      }

      late final double? orientatedWidth;
      late final double? orientatedHeight;

      if (asset.exifInfo != null) {
        orientatedWidth = asset.orientatedWidth?.toDouble();
        orientatedHeight = asset.orientatedHeight?.toDouble();
      } else if (localEntity != null) {
        final entity = await localEntity;
        if (entity != null) {
          asset.local = entity;
          orientatedWidth = entity.orientatedWidth.toDouble();
          orientatedHeight = entity.orientatedHeight.toDouble();
        }
      } else {
        final entity = await ref.read(assetServiceProvider).loadExif(asset);
        orientatedWidth = entity.orientatedWidth?.toDouble();
        orientatedHeight = entity.orientatedHeight?.toDouble();
      }

      if (orientatedWidth != null &&
          orientatedHeight != null &&
          orientatedWidth > 0 &&
          orientatedHeight > 0) {
        return orientatedWidth / orientatedHeight;
      }

      return 1.0;
    }

    Future<VideoSource?> createSource() async {
      if (!context.mounted) {
        return null;
      }

      if (localEntity != null && asset.livePhotoVideoId == null) {
        final file = await (await localEntity)!.file;
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
      final String videoUrl = asset.livePhotoVideoId != null
          ? '$serverEndpoint/assets/${asset.livePhotoVideoId}/video/playback'
          : '$serverEndpoint/assets/${asset.remoteId}/video/playback';

      final source = await VideoSource.init(
        path: videoUrl,
        type: VideoSourceType.network,
        headers: ApiService.getRequestHeaders(),
      );
      return source;
    }

    final videoSource = useState<VideoSource?>(null);
    final aspectRatio = useState<double?>(null);
    useMemoized(
      () async {
        if (!context.mounted) {
          return null;
        }

        final (videoSourceRes, aspectRatioRes) =
            await (createSource(), calculateAspectRatio()).wait;
        if (videoSourceRes == null || aspectRatioRes == null) {
          return;
        }

        // if opening a remote video from a hero animation, delay initialization to avoid a stutter
        if (!asset.isLocal && isCurrent) {
          await Future.delayed(const Duration(milliseconds: 150));
        }

        videoSource.value = videoSourceRes;
        aspectRatio.value = aspectRatioRes;
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

    // timer to mark videos as buffering if the position does not change
    useInterval(const Duration(seconds: 5), checkIfBuffering);

    // When the volume changes, set the volume
    ref.listen(videoPlayerControlsProvider.select((value) => value.mute),
        (_, mute) {
      final playerController = controller.value;
      if (playerController == null) {
        return;
      }

      final playbackInfo = playerController.playbackInfo;
      if (playbackInfo == null) {
        return;
      }

      try {
        if (mute && playbackInfo.volume != 0.0) {
          playerController.setVolume(0.0);
        } else if (!mute && playbackInfo.volume != 0.7) {
          playerController.setVolume(0.7);
        }
      } catch (error) {
        log.severe('Error setting volume: $error');
      }
    });

    // When the position changes, seek to the position
    final seekThrottler =
        useThrottler(interval: const Duration(milliseconds: 200));
    ref.listen(videoPlayerControlsProvider.select((value) => value.position),
        (_, position) {
      final playerController = controller.value;
      if (playerController == null) {
        return;
      }

      final playbackInfo = playerController.playbackInfo;
      if (playbackInfo == null) {
        return;
      }

      // Find the position to seek to
      final int seek = (asset.duration * (position / 100.0)).inSeconds;
      if (seek != playbackInfo.position) {
        try {
          seekThrottler.run(() => playerController.seekTo(seek));
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
      final videoController = controller.value;
      if (videoController == null || !context.mounted) {
        return;
      }

      try {
        if (pause) {
          videoController.pause();
        } else {
          videoController.play();
        }
      } catch (error) {
        log.severe('Error pausing or playing video: $error');
      }
    });

    void onPlaybackReady() {
      final videoController = controller.value;
      if (videoController == null || !isCurrent || !context.mounted) {
        return;
      }

      try {
        videoController.play();
        videoController.setVolume(0.9);
      } catch (error) {
        log.severe('Error playing video: $error');
      }
    }

    ref.listen(currentAssetProvider, (_, value) {
      // Delay the video playback to avoid a stutter in the swipe animation
      Timer(const Duration(milliseconds: 350), () {
        if (!context.mounted) {
          return;
        }

        currentAsset.value = value;
        if (currentAsset.value == asset) {
          onPlaybackReady();
        }
      });
    });

    void onPlaybackStatusChanged() {
      final videoController = controller.value;
      if (videoController == null || !context.mounted) {
        return;
      }

      final videoPlayback =
          VideoPlaybackValue.fromNativeController(videoController);
      if (videoPlayback.state == VideoPlaybackState.completed && loopVideo) {
        return;
      }
      ref.read(videoPlaybackValueProvider.notifier).value = videoPlayback;

      if (videoPlayback.state == VideoPlaybackState.playing) {
        // Sync with the controls playing
        WakelockPlus.enable();
      } else {
        // Sync with the controls pause
        WakelockPlus.disable();
      }
    }

    void onPlaybackPositionChanged() {
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

      if (loopVideo) {
        try {
          videoController.play();
        } catch (error) {
          log.severe('Error looping video: $error');
        }
      } else {
        WakelockPlus.disable();
      }
    }

    void initController(NativeVideoPlayerController nc) {
      if (controller.value != null) {
        return;
      }
      ref.read(videoPlayerControlsProvider.notifier).reset();
      ref.read(videoPlaybackValueProvider.notifier).reset();

      nc.onPlaybackPositionChanged.addListener(onPlaybackPositionChanged);
      nc.onPlaybackStatusChanged.addListener(onPlaybackStatusChanged);
      nc.onPlaybackReady.addListener(onPlaybackReady);
      nc.onPlaybackEnded.addListener(onPlaybackEnded);

      nc.loadVideoSource(videoSource.value!);

      controller.value = nc;
      Timer(const Duration(milliseconds: 200), checkIfBuffering);
    }

    useEffect(
      () {
        return () {
          final playerController = controller.value;
          if (playerController == null) {
            return;
          }

          try {
            playerController.stop();

            playerController.onPlaybackPositionChanged
                .removeListener(onPlaybackPositionChanged);
            playerController.onPlaybackStatusChanged
                .removeListener(onPlaybackStatusChanged);
            playerController.onPlaybackReady.removeListener(onPlaybackReady);
            playerController.onPlaybackEnded.removeListener(onPlaybackEnded);
          } catch (error) {
            log.severe('Error during useEffect cleanup: $error');
          }

          controller.value = null;
          WakelockPlus.disable();
        };
      },
      [videoSource],
    );

    return Stack(
      children: [
        placeholder,
        Center(
          key: ValueKey('player-${asset.hashCode}'),
          child: aspectRatio.value != null
              ? AspectRatio(
                  key: ValueKey(asset),
                  aspectRatio: aspectRatio.value!,
                  child: isCurrent
                      ? NativeVideoPlayerView(
                          key: ValueKey(asset),
                          onViewReady: initController,
                        )
                      : null,
                )
              : null,
        ),
        // covers the video with the placeholder
        if (showControls)
          Center(
            key: ValueKey('controls-${asset.hashCode}'),
            child: CustomVideoPlayerControls(
              hideTimerDuration: hideControlsTimer,
            ),
          ),
      ],
    );
  }
}
