import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/providers/asset_viewer/native_video_player_controller_provider.dart';
import 'package:immich_mobile/providers/asset_viewer/show_controls.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_controller_provider.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_controls_provider.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_value_provider.dart';
import 'package:immich_mobile/widgets/asset_viewer/video_player.dart';
import 'package:immich_mobile/widgets/common/delayed_loading_indicator.dart';
import 'package:native_video_player/native_video_player.dart';
import 'package:wakelock_plus/wakelock_plus.dart';

class NativeVideoViewerPage extends ConsumerStatefulWidget {
  final Asset asset;
  final Widget? placeholder;

  const NativeVideoViewerPage({
    super.key,
    required this.asset,
    this.placeholder,
  });

  @override
  NativeVideoViewerPageState createState() => NativeVideoViewerPageState();
}

class NativeVideoViewerPageState extends ConsumerState<NativeVideoViewerPage> {
  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.sizeOf(context);
    double videoWidth = size.width;
    double videoHeight = size.height;

    NativeVideoPlayerController? controller;

    void initController(NativeVideoPlayerController videoCtrl) {
      controller = videoCtrl;

      controller?.onPlaybackReady.addListener(() {
        // Emitted when the video loaded successfully and it's ready to play.
        // At this point, videoInfo is available.
        final videoInfo = controller?.videoInfo;

        setState(() {
          if (videoInfo != null) {
            videoWidth = videoInfo.width.toDouble();
            videoHeight = videoInfo.height.toDouble();

            print(videoHeight);
            print(videoWidth);
          }
        });

        final videoDuration = videoInfo?.duration;

        controller?.play();
      });

      controller?.onPlaybackStatusChanged.addListener(() {
        final playbackStatus = controller?.playbackInfo?.status;
        // playbackStatus can be playing, paused, or stopped.
      });

      controller?.onPlaybackPositionChanged.addListener(() {
        final playbackPosition = controller?.playbackInfo?.position;
      });

      controller?.onPlaybackEnded.addListener(() {
        // Emitted when the video has finished playing.
      });
    }

    dispose() {
      controller = null;
      super.dispose();
    }

    return PopScope(
      onPopInvoked: (pop) {
        ref.read(videoPlaybackValueProvider.notifier).value =
            VideoPlaybackValue.uninitialized();
      },
      child: SizedBox(
        height: videoHeight,
        width: videoWidth,
        child: AspectRatio(
          aspectRatio: 16 / 9,
          child: NativeVideoPlayerView(
            onViewReady: (c) async {
              // Use a local file for the video player controller
              final file = await widget.asset.local!.file;
              if (file == null) {
                throw Exception('No file found for the video');
              }

              final videoSource = await VideoSource.init(
                path: file.path,
                type: VideoSourceType.file,
              );

              await c.loadVideoSource(videoSource);
              initController(c);
            },
          ),
        ),
      ),
    );
  }
  // final Asset asset;
  // final Widget? placeholder;
  // final Duration hideControlsTimer;
  // final bool showControls;
  // final bool showDownloadingIndicator;
  // final bool loopVideo;
}
