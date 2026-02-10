import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_hooks/flutter_hooks.dart' hide Store;
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/setting.model.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/setting.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/infrastructure/repositories/storage.repository.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_viewer.state.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/video_viewer_controls.widget.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/is_motion_video_playing.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_controls_provider.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_value_provider.dart';
import 'package:immich_mobile/providers/asset_viewer/video_quality_override.provider.dart';
import 'package:immich_mobile/providers/cast.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/current_asset.provider.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/services/app_settings.service.dart';

import 'package:immich_mobile/widgets/photo_view/photo_view.dart';
import 'package:logging/logging.dart';
import 'package:media_kit/media_kit.dart';
import 'package:media_kit_video/media_kit_video.dart';
import 'package:wakelock_plus/wakelock_plus.dart';

bool _isCurrentAsset(BaseAsset asset, BaseAsset? currentAsset) {
  if (asset is RemoteAsset) {
    return switch (currentAsset) {
      RemoteAsset remoteAsset => remoteAsset.id == asset.id,
      LocalAsset localAsset => localAsset.remoteId == asset.id,
      _ => false,
    };
  } else if (asset is LocalAsset) {
    return switch (currentAsset) {
      RemoteAsset remoteAsset => remoteAsset.localId == asset.id,
      LocalAsset localAsset => localAsset.id == asset.id,
      _ => false,
    };
  }
  return false;
}

class NativeVideoViewer extends HookConsumerWidget {
  static final log = Logger('NativeVideoViewer');
  final BaseAsset asset;
  final bool showControls;
  final int playbackDelayFactor;
  final Widget image;
  final ValueNotifier<PhotoViewScaleState>? scaleStateNotifier;
  final bool disableScaleGestures;

  const NativeVideoViewer({
    super.key,
    required this.asset,
    required this.image,
    this.showControls = true,
    this.playbackDelayFactor = 1,
    this.scaleStateNotifier,
    this.disableScaleGestures = false,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // MediaKit Player & Controller
    final player = useMemoized(() => Player());
    final videoController = useMemoized(() => VideoController(player));

    // final controller = useState<NativeVideoPlayerController?>(null); // Replaced by player
    final lastVideoPosition = useRef(Duration.zero);
    final isBuffering = useRef(false);

    // Used to track whether the video should play when the app
    // is brought back to the foreground
    final shouldPlayOnForeground = useRef(true);

    final currentAsset = ref.watch(currentAssetNotifier);
    final isCurrent = _isCurrentAsset(asset, currentAsset);

    // Used to show the placeholder during hero animations for remote videos to avoid a stutter
    // used to show the placeholder during hero animations and cross-fade the video player in
    final isPlayerReady = useState(false);

    final isCasting = ref.watch(castProvider.select((c) => c.isCasting));

    // Determine if we should load original quality based on settings and override
    final globalLoadOriginal = ref
        .watch(appSettingsServiceProvider)
        .getSetting<bool>(AppSettingsEnum.loadOriginalVideo);
    final qualityOverride = ref.watch(videoQualityOverrideProvider);
    final isOriginalVideo = qualityOverride ?? globalLoadOriginal;

    // Create Media source
    Future<Media?> createMedia() async {
      if (!context.mounted) {
        return null;
      }

      final videoAsset = await ref.read(assetServiceProvider).getAsset(asset) ?? asset;
      if (!context.mounted) {
        return null;
      }

      try {
        if (videoAsset.hasLocal && videoAsset.livePhotoVideoId == null) {
          final id = videoAsset is LocalAsset ? videoAsset.id : (videoAsset as RemoteAsset).localId!;
          final file = await StorageRepository().getFileForAsset(id);
          if (!context.mounted) {
            return null;
          }

          if (file == null) {
            throw Exception('No file found for the video');
          }

          // MediaKit handles file paths directly or file:// URIs
          return Media(file.path);
        }

        final remoteId = (videoAsset as RemoteAsset).id;

        // Use a network URL for the video player controller
        final serverEndpoint = Store.get(StoreKey.serverEndpoint);

        final String postfixUrl = isOriginalVideo ? 'original' : 'video/playback';
        final String videoUrl = videoAsset.livePhotoVideoId != null
            ? '$serverEndpoint/assets/${videoAsset.livePhotoVideoId}/$postfixUrl'
            : '$serverEndpoint/assets/$remoteId/$postfixUrl';

        // MediaKit supports headers
        return Media(videoUrl, httpHeaders: ApiService.getRequestHeaders());
      } catch (error) {
        log.severe('Error creating video source for asset ${videoAsset.name}: $error');
        return null;
      }
    }

    final mediaSource = useMemoized<Future<Media?>>(() => createMedia(), [asset.heroTag, isOriginalVideo]);
    final aspectRatio = useState<double?>(null);

    // Dispose player on unmount
    useEffect(() {
      return player.dispose;
    }, [player]);

    // Load Aspect Ratio
    useMemoized(() async {
      if (!context.mounted || aspectRatio.value != null) {
        return null;
      }

      try {
        aspectRatio.value = await ref.read(assetServiceProvider).getAspectRatio(asset);
      } catch (error) {
        log.severe('Error getting aspect ratio for asset ${asset.name}: $error');
      }
    }, [asset.heroTag]);

    // Sync Player State with Riverpod
    useEffect(() {
      final subscriptions = <StreamSubscription>[];

      // Track metadata changes to extract technical info
      subscriptions.add(
        player.stream.track.listen((track) {
          if (!context.mounted) return;
        }),
      );

      // Position & Buffering
      subscriptions.add(
        player.stream.position.listen((position) {
          if (!context.mounted) return;

          // Update Riverpod State
          final notifier = ref.read(videoPlaybackValueProvider.notifier);
          if (notifier.value.position != position) {
            notifier.position = position;
          }

          // Sync duration if different
          if (notifier.value.duration != player.state.duration) {
            notifier.duration = player.state.duration;
          }

          // Buffering Check (Simplified)
          if (player.state.playing) {
            if (lastVideoPosition.value == position) {
              // Potentially buffering if position stuck while playing
              // MediaKit has buffering stream
            } else {
              lastVideoPosition.value = position;
            }
          }
        }),
      );

      // Buffering Stream
      subscriptions.add(
        player.stream.buffering.listen((buffering) {
          if (!context.mounted) return;
          isBuffering.value = buffering;

          final playbackValue = ref.read(videoPlaybackValueProvider);
          if (buffering && playbackValue.state != VideoPlaybackState.buffering) {
            ref.read(videoPlaybackValueProvider.notifier).status = VideoPlaybackState.buffering;
          } else if (!buffering && playbackValue.state == VideoPlaybackState.buffering) {
            // Restore state
            ref.read(videoPlaybackValueProvider.notifier).status = player.state.playing
                ? VideoPlaybackState.playing
                : VideoPlaybackState.paused;
          }
        }),
      );

      // Playback State (Playing/Paused/Completed)
      subscriptions.add(
        player.stream.playing.listen((playing) {
          if (!context.mounted) return;
          if (playing) {
            WakelockPlus.enable();
            ref.read(videoPlaybackValueProvider.notifier).status = VideoPlaybackState.playing;
          } else {
            WakelockPlus.disable();
            ref.read(videoPlaybackValueProvider.notifier).status = VideoPlaybackState.paused;
          }
        }),
      );

      subscriptions.add(
        player.stream.completed.listen((completed) {
          if (!context.mounted) return;
          if (completed) {
            ref.read(videoPlaybackValueProvider.notifier).status = VideoPlaybackState.completed;
            if (!ref.read(appSettingsServiceProvider).getSetting<bool>(AppSettingsEnum.loopVideo)) {
              ref.read(isPlayingMotionVideoProvider.notifier).playing = false;
            }
          }
        }),
      );

      // Initial Sync
      subscriptions.add(
        player.stream.duration.listen((duration) {
          if (!context.mounted) return;
          ref.read(videoPlaybackValueProvider.notifier).duration = duration;
        }),
      );

      return () {
        for (final sub in subscriptions) {
          sub.cancel();
        }
      };
    }, [player]);

    // Initialization Logic
    void initPlayer() async {
      // Create Media
      final media = await mediaSource;
      if (media == null || !context.mounted) return;

      // Reset Providers
      ref.read(videoPlayerControlsProvider.notifier).reset();
      ref.read(videoPlaybackValueProvider.notifier).reset();

      // Open Media
      await player.open(media, play: false); // Don't auto-play immediately, control it below

      // Loop Setting
      final loopVideo = ref.read(appSettingsServiceProvider).getSetting<bool>(AppSettingsEnum.loopVideo);
      await player.setPlaylistMode((!asset.isMotionPhoto && loopVideo) ? PlaylistMode.single : PlaylistMode.none);

      // Auto Play
      if (isCurrent && !ref.read(assetViewerProvider.select((s) => s.showingBottomSheet))) {
        final autoPlayVideo = AppSetting.get(Setting.autoPlayVideo);
        if (autoPlayVideo) {
          await player.play();
        }
        await player.setVolume(
          100.0,
        ); // MediaKit volume is 0-100 usually, check docs. Default is 100. Native was 0.0-1.0
      }
    }

    // Trigger Init when current asset changes or view is ready
    useEffect(() {
      if (isCurrent) {
        // Wait for Hero animation to finish before initializing player
        // to avoid surface attachment issues on Android (Static Frame Bug)
        Future.delayed(const Duration(milliseconds: 100), () {
          if (context.mounted && isCurrent) {
            initPlayer();
          }
        });
      } else {
        // No longer current
        player.pause();
        isPlayerReady.value = false;
        ref.read(videoQualityOverrideProvider.notifier).state = null;
      }
      return null;
    }, [isCurrent, mediaSource]);

    // Wait for the first frame to render before hiding the placeholder
    useEffect(() {
      Timer? timer;
      void check() {
        if (player.state.playing && (player.state.width ?? 0) > 0 && context.mounted && !isPlayerReady.value) {
          isPlayerReady.value = true;
          timer?.cancel();
        }
      }

      final sub = player.stream.playing.listen((_) => check());
      final subWidth = player.stream.width.listen((_) => check());

      // Fallback timeout in case streams never fire or state is inconsistent
      timer = Timer(const Duration(milliseconds: 800), () {
        if (context.mounted && !isPlayerReady.value) {
          log.warning('Video visibility fallback triggered for asset ${asset.name}');
          isPlayerReady.value = true;
        }
      });

      // Initial check in case state is already populated
      check();

      return () {
        sub.cancel();
        subWidth.cancel();
        timer?.cancel();
      };
    }, [asset]);

    // Listen to Controls (Play/Pause/Seek) from UI
    ref.listen(videoPlayerControlsProvider, (oldControls, newControls) {
      if (oldControls?.position != newControls.position) {
        player.seek(newControls.position);
      }
      if (oldControls?.pause != newControls.pause) {
        if (newControls.pause) {
          player.pause();
        } else {
          player.play();
        }
      }
    });

    // Handle App Lifecycle
    useOnAppLifecycleStateChange((_, state) {
      if (state == AppLifecycleState.resumed && shouldPlayOnForeground.value) {
        player.play();
      } else if (state == AppLifecycleState.paused) {
        if (player.state.playing) {
          shouldPlayOnForeground.value = true;
          player.pause();
        } else {
          shouldPlayOnForeground.value = false;
        }
      }
    });

    // Asset Swipe Logic (Preloading/Playing)
    // Reset isPlayerReady when swiping away to ensure next entry shows placeholder
    useEffect(() {
      if (!isCurrent) {
        isPlayerReady.value = false;
      }
      return null;
    }, [isCurrent]);

    Size? videoContextSize(double? videoAspectRatio, BuildContext? ctx) {
      Size? videoCtxSize;
      if (videoAspectRatio == null || ctx == null) {
        return null;
      }
      final contextAspectRatio = ctx.width / ctx.height;
      if (videoAspectRatio > contextAspectRatio) {
        videoCtxSize = Size(ctx.width, ctx.width / aspectRatio.value!);
      } else {
        videoCtxSize = Size(ctx.height * aspectRatio.value!, ctx.height);
      }
      return videoCtxSize;
    }

    // Long Press Speed Logic
    void onLongPressStart(LongPressStartDetails details) {
      HapticFeedback.selectionClick();
      player.setRate(2.0);
      Fluttertoast.showToast(
        msg: "2x Speed",
        toastLength: Toast.LENGTH_SHORT,
        gravity: ToastGravity.TOP,
        timeInSecForIosWeb: 1,
        backgroundColor: Colors.black54,
        textColor: Colors.white,
        fontSize: 16.0,
      );
    }

    void onLongPressEnd(LongPressEndDetails details) {
      player.setRate(1.0);
    }

    return SizedBox(
      width: context.width,
      height: context.height,
      child: Stack(
        children: [
          if (aspectRatio.value != null && !isCasting && isCurrent)
            GestureDetector(
              key: ValueKey(asset),
              onLongPressStart: onLongPressStart,
              onLongPressEnd: onLongPressEnd,
              child: PhotoView.customChild(
                key: ValueKey("photo_${asset.heroTag}"),
                enableRotation: false,
                disableScaleGestures: disableScaleGestures,
                backgroundDecoration: const BoxDecoration(color: Colors.transparent),
                scaleStateChangedCallback: (state) => scaleStateNotifier?.value = state,
                childSize: videoContextSize(aspectRatio.value, context),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    Center(key: ValueKey("placeholder_${asset.heroTag}"), child: image),
                    AnimatedOpacity(
                      opacity: isPlayerReady.value ? 1.0 : 0.0,
                      duration: const Duration(milliseconds: 200),
                      child: Video(
                        key: ValueKey("video_${asset.heroTag}"),
                        controller: videoController,
                        controls: NoVideoControls,
                        pauseUponEnteringBackgroundMode: false,
                        resumeUponEnteringForegroundMode: false,
                        fill: Colors.transparent,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          if (showControls) const Center(child: VideoViewerControls()),
        ],
      ),
    );
  }
}
