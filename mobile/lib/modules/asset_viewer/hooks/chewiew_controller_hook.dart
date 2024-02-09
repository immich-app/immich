import 'dart:async';

import 'package:chewie/chewie.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:video_player/video_player.dart';
import 'package:immich_mobile/shared/models/store.dart' as store;
import 'package:wakelock_plus/wakelock_plus.dart';

/// Provides the initialized video player controller
/// If the asset is local, use the local file
/// Otherwise, use a video player with a URL
ChewieController? useChewieController(
  Asset asset, {
  EdgeInsets controlsSafeAreaMinimum = const EdgeInsets.only(
    bottom: 100,
  ),
  bool showOptions = true,
  bool showControlsOnInitialize = false,
  bool autoPlay = true,
  bool autoInitialize = true,
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
  return use(
    _ChewieControllerHook(
      asset: asset,
      placeholder: placeholder,
      showOptions: showOptions,
      controlsSafeAreaMinimum: controlsSafeAreaMinimum,
      autoPlay: autoPlay,
      allowFullScreen: allowFullScreen,
      customControls: customControls,
      hideControlsTimer: hideControlsTimer,
      showControlsOnInitialize: showControlsOnInitialize,
      showControls: showControls,
      autoInitialize: autoInitialize,
      allowedScreenSleep: allowedScreenSleep,
      onPlaying: onPlaying,
      onPaused: onPaused,
      onVideoEnded: onVideoEnded,
    ),
  );
}

class _ChewieControllerHook extends Hook<ChewieController?> {
  final Asset asset;
  final EdgeInsets controlsSafeAreaMinimum;
  final bool showOptions;
  final bool showControlsOnInitialize;
  final bool autoPlay;
  final bool autoInitialize;
  final bool allowFullScreen;
  final bool allowedScreenSleep;
  final bool showControls;
  final Widget? customControls;
  final Widget? placeholder;
  final Duration hideControlsTimer;
  final VoidCallback? onPlaying;
  final VoidCallback? onPaused;
  final VoidCallback? onVideoEnded;

  const _ChewieControllerHook({
    required this.asset,
    this.controlsSafeAreaMinimum = const EdgeInsets.only(
      bottom: 100,
    ),
    this.showOptions = true,
    this.showControlsOnInitialize = false,
    this.autoPlay = true,
    this.autoInitialize = true,
    this.allowFullScreen = false,
    this.allowedScreenSleep = false,
    this.showControls = true,
    this.customControls,
    this.placeholder,
    this.hideControlsTimer = const Duration(seconds: 3),
    this.onPlaying,
    this.onPaused,
    this.onVideoEnded,
  });

  @override
  createState() => _ChewieControllerHookState();
}

class _ChewieControllerHookState
    extends HookState<ChewieController?, _ChewieControllerHook> {
  ChewieController? chewieController;
  VideoPlayerController? videoPlayerController;

  @override
  void initHook() async {
    super.initHook();
    unawaited(_initialize());
  }

  @override
  void dispose() {
    chewieController?.dispose();
    videoPlayerController?.dispose();
    super.dispose();
  }

  @override
  ChewieController? build(BuildContext context) {
    return chewieController;
  }

  /// Initializes the chewie controller and video player controller
  Future<void> _initialize() async {
    if (hook.asset.isLocal && hook.asset.livePhotoVideoId == null) {
      // Use a local file for the video player controller
      final file = await hook.asset.local!.file;
      if (file == null) {
        throw Exception('No file found for the video');
      }
      videoPlayerController = VideoPlayerController.file(file);
    } else {
      // Use a network URL for the video player controller
      final serverEndpoint = store.Store.get(store.StoreKey.serverEndpoint);
      final String videoUrl = hook.asset.livePhotoVideoId != null
          ? '$serverEndpoint/asset/file/${hook.asset.livePhotoVideoId}'
          : '$serverEndpoint/asset/file/${hook.asset.remoteId}';

      final url = Uri.parse(videoUrl);
      final accessToken = store.Store.get(StoreKey.accessToken);

      videoPlayerController = VideoPlayerController.networkUrl(
        url,
        httpHeaders: {"x-immich-user-token": accessToken},
      );
    }

    videoPlayerController!.addListener(() {
      final value = videoPlayerController!.value;
      if (value.isPlaying) {
        WakelockPlus.enable();
        hook.onPlaying?.call();
      } else if (!value.isPlaying) {
        WakelockPlus.disable();
        hook.onPaused?.call();
      }

      if (value.position == value.duration) {
        WakelockPlus.disable();
        hook.onVideoEnded?.call();
      }
    });

    await videoPlayerController!.initialize();

    setState(() {
      chewieController = ChewieController(
        videoPlayerController: videoPlayerController!,
        controlsSafeAreaMinimum: hook.controlsSafeAreaMinimum,
        showOptions: hook.showOptions,
        showControlsOnInitialize: hook.showControlsOnInitialize,
        autoPlay: hook.autoPlay,
        autoInitialize: hook.autoInitialize,
        allowFullScreen: hook.allowFullScreen,
        allowedScreenSleep: hook.allowedScreenSleep,
        showControls: hook.showControls,
        customControls: hook.customControls,
        placeholder: hook.placeholder,
        hideControlsTimer: hook.hideControlsTimer,
      );
    });
  }
}
