import 'dart:async';
import 'dart:io';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart' hide Store;
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/current_asset.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/is_motion_video_playing.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_provider.dart';
import 'package:immich_mobile/providers/cast.provider.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/services/asset.service.dart';
import 'package:immich_mobile/widgets/asset_viewer/custom_video_player_controls.dart';
import 'package:logging/logging.dart';
import 'package:native_video_player/native_video_player.dart';

@RoutePage()
class NativeVideoViewerPage extends HookConsumerWidget {
  static final log = Logger('NativeVideoViewer');
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
    final videoId = asset.id.toString();
    final controller = useState<NativeVideoPlayerController?>(null);
    final shouldPlayOnForeground = useRef(true);

    final currentAsset = useState(ref.read(currentAssetProvider));
    final isCurrent = currentAsset.value == asset;

    // Used to show the placeholder during hero animations for remote videos to avoid a stutter
    final isVisible = useState(Platform.isIOS && asset.isLocal);

    final isCasting = ref.watch(castProvider.select((c) => c.isCasting));

    final isVideoReady = useState(false);

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

          final source = await VideoSource.init(path: file.path, type: VideoSourceType.file);
          return source;
        }

        // Use a network URL for the video player controller
        final serverEndpoint = Store.get(StoreKey.serverEndpoint);
        final isOriginalVideo = ref
            .read(appSettingsServiceProvider)
            .getSetting<bool>(AppSettingsEnum.loadOriginalVideo);
        final String postfixUrl = isOriginalVideo ? 'original' : 'video/playback';
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
        log.severe('Error creating video source for asset ${asset.fileName}: $error');
        return null;
      }
    }

    final videoSource = useMemoized<Future<VideoSource?>>(() => createSource());
    final aspectRatio = useState<double?>(asset.aspectRatio);
    useMemoized(() async {
      if (!context.mounted || aspectRatio.value != null) {
        return null;
      }

      try {
        aspectRatio.value = await ref.read(assetServiceProvider).getAspectRatio(asset);
      } catch (error) {
        log.severe('Error getting aspect ratio for asset ${asset.fileName}: $error');
      }
    });

    void onPlaybackReady() async {
      final videoController = controller.value;
      if (videoController == null || !isCurrent || !context.mounted) {
        return;
      }

      final notifier = ref.read(videoPlayerProvider(videoId).notifier);
      notifier.onNativePlaybackReady();

      isVideoReady.value = true;

      try {
        final autoPlayVideo = ref.read(appSettingsServiceProvider).getSetting<bool>(AppSettingsEnum.autoPlayVideo);
        if (autoPlayVideo) {
          await notifier.play();
        }
        await notifier.setVolume(1);
      } catch (error) {
        log.severe('Error playing video: $error');
      }
    }

    void onPlaybackStatusChanged() {
      if (!context.mounted) return;
      ref.read(videoPlayerProvider(videoId).notifier).onNativeStatusChanged();
    }

    void onPlaybackPositionChanged() {
      if (!context.mounted) return;
      ref.read(videoPlayerProvider(videoId).notifier).onNativePositionChanged();
    }

    void onPlaybackEnded() {
      if (!context.mounted) return;

      ref.read(videoPlayerProvider(videoId).notifier).onNativePlaybackEnded();

      final videoController = controller.value;
      if (videoController?.playbackInfo?.status == PlaybackStatus.stopped &&
          !ref.read(appSettingsServiceProvider).getSetting<bool>(AppSettingsEnum.loopVideo)) {
        ref.read(isPlayingMotionVideoProvider.notifier).playing = false;
      }
    }

    void removeListeners(NativeVideoPlayerController controller) {
      controller.onPlaybackPositionChanged.removeListener(onPlaybackPositionChanged);
      controller.onPlaybackStatusChanged.removeListener(onPlaybackStatusChanged);
      controller.onPlaybackReady.removeListener(onPlaybackReady);
      controller.onPlaybackEnded.removeListener(onPlaybackEnded);
    }

    void initController(NativeVideoPlayerController nc) async {
      if (controller.value != null || !context.mounted) {
        return;
      }

      final source = await videoSource;
      if (source == null) {
        return;
      }

      final notifier = ref.read(videoPlayerProvider(videoId).notifier);
      notifier.attachController(nc);

      nc.onPlaybackPositionChanged.addListener(onPlaybackPositionChanged);
      nc.onPlaybackStatusChanged.addListener(onPlaybackStatusChanged);
      nc.onPlaybackReady.addListener(onPlaybackReady);
      nc.onPlaybackEnded.addListener(onPlaybackEnded);

      unawaited(
        nc.loadVideoSource(source).catchError((error) {
          log.severe('Error loading video source: $error');
        }),
      );
      final loopVideo = ref.read(appSettingsServiceProvider).getSetting<bool>(AppSettingsEnum.loopVideo);
      await notifier.setLoop(loopVideo);

      controller.value = nc;
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
      Timer(
        Platform.isIOS
            ? Duration(milliseconds: 300 * playbackDelayFactor)
            : imageToVideo
            ? Duration(milliseconds: 200 * playbackDelayFactor)
            : Duration(milliseconds: 400 * playbackDelayFactor),
        () {
          if (!context.mounted) {
            return;
          }

          currentAsset.value = value;
          if (currentAsset.value == asset) {
            onPlaybackReady();
          }
        },
      );
    });

    useEffect(() {
      // If opening a remote video from a hero animation, delay visibility to avoid a stutter
      final timer = isVisible.value ? null : Timer(const Duration(milliseconds: 300), () => isVisible.value = true);

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
      };
    }, const []);

    useOnAppLifecycleStateChange((_, state) async {
      final notifier = ref.read(videoPlayerProvider(videoId).notifier);
      if (state == AppLifecycleState.resumed && shouldPlayOnForeground.value) {
        await notifier.play();
      } else if (state == AppLifecycleState.paused) {
        final videoPlaying = await controller.value?.isPlaying();
        if (videoPlaying ?? true) {
          shouldPlayOnForeground.value = true;
          await notifier.pause();
        } else {
          shouldPlayOnForeground.value = false;
        }
      }
    });

    return Stack(
      children: [
        // This remains under the video to avoid flickering
        // For motion videos, this is the image portion of the asset
        if (!isVideoReady.value || asset.isMotionPhoto) Center(key: ValueKey(asset.id), child: image),
        if (aspectRatio.value != null && !isCasting)
          Visibility.maintain(
            key: ValueKey(asset),
            visible: isVisible.value,
            child: Center(
              key: ValueKey(asset),
              child: AspectRatio(
                key: ValueKey(asset),
                aspectRatio: aspectRatio.value!,
                child: isCurrent ? NativeVideoPlayerView(key: ValueKey(asset), onViewReady: initController) : null,
              ),
            ),
          ),
        if (showControls) Center(child: CustomVideoPlayerControls(videoId: videoId)),
      ],
    );
  }
}
