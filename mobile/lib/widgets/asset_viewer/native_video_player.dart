import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:native_video_player/native_video_player.dart';
import 'package:video_player/video_player.dart';

class NativeVideoPlayer extends HookConsumerWidget {
  final VideoPlayerController controller;
  final bool isMotionVideo;
  final Widget? placeholder;
  final Duration hideControlsTimer;
  final bool showControls;
  final bool showDownloadingIndicator;
  final bool loopVideo;
  final Asset asset;

  const NativeVideoPlayer({
    super.key,
    required this.controller,
    required this.isMotionVideo,
    this.placeholder,
    required this.hideControlsTimer,
    required this.showControls,
    required this.showDownloadingIndicator,
    required this.loopVideo,
    required this.asset,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return NativeVideoPlayerView(
      onViewReady: (controller) async {
        try {
          String path = '';
          VideoSourceType type = VideoSourceType.file;
          if (asset.isLocal && asset.livePhotoVideoId == null) {
            // Use a local file for the video player controller
            final file = await asset.local!.file;
            if (file == null) {
              throw Exception('No file found for the video');
            }
            path = file.path;
            type = VideoSourceType.file;

            final videoSource = await VideoSource.init(
              path: path,
              type: type,
            );

            await controller.loadVideoSource(videoSource);
            await controller.play();

            Future.delayed(const Duration(milliseconds: 100), () async {
              await controller.setVolume(0.5);
            });
          }
        } catch (e) {
          print('Error loading video: $e');
        }
      },
    );
  }
}
