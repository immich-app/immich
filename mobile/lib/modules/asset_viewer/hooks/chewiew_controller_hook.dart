import 'dart:async';

import 'package:chewie/chewie.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:video_player/video_player.dart';
import 'package:immich_mobile/shared/models/store.dart' as store;

/// Provides the initialized video player controller
/// If the asset is local, use the local file
/// Otherwise, use a video player with a URL
AsyncSnapshot<ChewieController> useChewieController(
  Asset asset, {
  EdgeInsets controlsSafeAreaMinimum = const EdgeInsets.only(
    bottom: 100,
  ),
  bool showOptions = true,
  bool showControlsOnInitialize = false,
  bool autoPlay = true,
  bool allowFullScreen = false,
  bool allowedScreenSleep = false,
  bool showControls = true,
  Widget? customControls,
  Widget? placeholder,
  Duration hideControlsTimer = const Duration(seconds: 1),
  VoidCallback? onPlaying,
  VoidCallback? onPaused,
  VoidCallback? onVideoEnded,
}) {
  /// Initializes the chewie controller and video player controller
  Future<ChewieController> initializeChewie(Asset asset) async {
    late VideoPlayerController videoPlayerController;
    if (asset.isLocal && asset.livePhotoVideoId == null) {
      // Use a local file for the video player controller
      final file = await asset.local!.file;
      if (file == null) {
        throw Exception('No file found for the video');
      }
      videoPlayerController = VideoPlayerController.file(file);
    } else {
      // Use a network URL for the video player controller
      final serverEndpoint = store.Store.get(store.StoreKey.serverEndpoint);
      final String videoUrl = asset.livePhotoVideoId != null
          ? '$serverEndpoint/asset/file/${asset.livePhotoVideoId}'
          : '$serverEndpoint/asset/file/${asset.remoteId}';

      final url = Uri.parse(videoUrl);
      final accessToken = store.Store.get(StoreKey.accessToken);

      videoPlayerController = VideoPlayerController.networkUrl(
        url,
        httpHeaders: {"x-immich-user-token": accessToken},
      );
    }

    await videoPlayerController.initialize();

    return ChewieController(
      videoPlayerController: videoPlayerController,
      controlsSafeAreaMinimum: controlsSafeAreaMinimum,
      showOptions: showOptions,
      showControlsOnInitialize: showControlsOnInitialize,
      autoPlay: autoPlay,
      allowFullScreen: allowFullScreen,
      allowedScreenSleep: allowedScreenSleep,
      showControls: showControls,
      customControls: customControls,
      placeholder: placeholder,
      hideControlsTimer: hideControlsTimer,
    );
  }

  final controller = useMemoized(() => initializeChewie(asset));
  return useFuture(controller);
}
