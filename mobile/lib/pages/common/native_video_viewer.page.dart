import 'dart:async';
import 'dart:io';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_hooks/flutter_hooks.dart' hide Store;
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/current_asset.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/is_motion_video_playing.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_controls_provider.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_value_provider.dart';
import 'package:immich_mobile/providers/cast.provider.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/services/asset.service.dart';
import 'package:immich_mobile/widgets/asset_viewer/custom_video_player_controls.dart';
import 'package:logging/logging.dart';
import 'package:media_kit/media_kit.dart';
import 'package:media_kit_video/media_kit_video.dart';
import 'package:wakelock_plus/wakelock_plus.dart';

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
    final player = useMemoized(() => Player());
    final videoController = useMemoized(() => VideoController(player));

    final lastVideoPosition = useRef(Duration.zero);
    final isBuffering = useRef(false);

    // Used to track whether the video should play when the app
    // is brought back to the foreground
    final shouldPlayOnForeground = useRef(true);

    final currentAsset = useState(ref.read(currentAssetProvider));
    final isCurrent = currentAsset.value == asset;

    // Used to show the placeholder during hero animations for remote videos to avoid a stutter
    final isVisible = useState(Platform.isIOS && asset.isLocal);

    final isCasting = ref.watch(castProvider.select((c) => c.isCasting));

    final isVideoReady = useState(false);

    Future<Media?> createMedia() async {
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

          return Media(file.path);
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

        return Media(videoUrl, httpHeaders: ApiService.getRequestHeaders());
      } catch (error) {
        log.severe('Error creating video source for asset ${asset.fileName}: $error');
        return null;
      }
    }

    final mediaSource = useMemoized<Future<Media?>>(() => createMedia());
    final aspectRatio = useState<double?>(asset.aspectRatio);

    useEffect(() {
      return player.dispose;
    }, [player]);

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

    // Sync Player State with Riverpod
    useEffect(() {
      final subscriptions = <StreamSubscription>[];

      subscriptions.add(
        player.stream.position.listen((position) {
          if (!context.mounted) return;
          final notifier = ref.read(videoPlaybackValueProvider.notifier);
          if (notifier.value.position != position) {
            notifier.position = position;
          }
          if (notifier.value.duration != player.state.duration) {
            notifier.duration = player.state.duration;
          }
          if (player.state.playing) {
            lastVideoPosition.value = position;
          }
        }),
      );

      subscriptions.add(
        player.stream.buffering.listen((buffering) {
          if (!context.mounted) return;
          isBuffering.value = buffering;
          final playbackValue = ref.read(videoPlaybackValueProvider);
          if (buffering && playbackValue.state != VideoPlaybackState.buffering) {
            ref.read(videoPlaybackValueProvider.notifier).status = VideoPlaybackState.buffering;
          } else if (!buffering && playbackValue.state == VideoPlaybackState.buffering) {
            ref.read(videoPlaybackValueProvider.notifier).status = player.state.playing
                ? VideoPlaybackState.playing
                : VideoPlaybackState.paused;
          }
        }),
      );

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
        player.stream.duration.listen((duration) {
          if (!context.mounted) return;
          ref.read(videoPlaybackValueProvider.notifier).duration = duration;
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

      return () {
        for (final sub in subscriptions) {
          sub.cancel();
        }
      };
    }, [player]);

    void initPlayer() async {
      final media = await mediaSource;
      if (media == null || !context.mounted) return;

      ref.read(videoPlayerControlsProvider.notifier).reset();
      ref.read(videoPlaybackValueProvider.notifier).reset();

      await player.open(media, play: false);

      final loopVideo = ref.read(appSettingsServiceProvider).getSetting<bool>(AppSettingsEnum.loopVideo);
      await player.setPlaylistMode(loopVideo ? PlaylistMode.single : PlaylistMode.none);

      if (isCurrent) {
        final autoPlayVideo = ref.read(appSettingsServiceProvider).getSetting<bool>(AppSettingsEnum.autoPlayVideo);
        if (autoPlayVideo) {
          await player.play();
        }
        await player.setVolume(100.0);
        isVideoReady.value = true;
      }
    }

    useEffect(() {
      if (isCurrent) {
        initPlayer();
      }
      return null;
    }, [isCurrent]);

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

    ref.listen(currentAssetProvider, (_, value) {
      if (value != asset) {
        player.pause();
      }
    });

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

    return Stack(
      children: [
        if (!isVideoReady.value || asset.isMotionPhoto) Center(key: ValueKey(asset.id), child: image),
        if (aspectRatio.value != null && !isCasting)
          Visibility.maintain(
            key: ValueKey(asset),
            visible: isVisible.value,
            child: GestureDetector(
              onLongPressStart: onLongPressStart,
              onLongPressEnd: onLongPressEnd,
              child: Center(
                key: ValueKey(asset),
                child: AspectRatio(
                  key: ValueKey(asset),
                  aspectRatio: aspectRatio.value!,
                  child: isCurrent ? Video(controller: videoController, controls: NoVideoControls) : null,
                ),
              ),
            ),
          ),
        if (showControls) const Center(child: CustomVideoPlayerControls()),
      ],
    );
  }
}
