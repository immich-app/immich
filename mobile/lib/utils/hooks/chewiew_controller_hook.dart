import 'package:chewie/chewie.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:video_player/video_player.dart';

/// Provides the initialized video player controller
/// If the asset is local, use the local file
/// Otherwise, use a video player with a URL
ChewieController useChewieController({
  required VideoPlayerController controller,
  EdgeInsets controlsSafeAreaMinimum = const EdgeInsets.only(
    bottom: 100,
  ),
  bool showOptions = true,
  bool showControlsOnInitialize = false,
  bool autoPlay = true,
  bool allowFullScreen = false,
  bool allowedScreenSleep = false,
  bool showControls = true,
  bool loopVideo = false,
  Widget? customControls,
  Widget? placeholder,
  Duration hideControlsTimer = const Duration(seconds: 1),
  VoidCallback? onPlaying,
  VoidCallback? onPaused,
  VoidCallback? onVideoEnded,
}) {
  return use(
    _ChewieControllerHook(
      controller: controller,
      placeholder: placeholder,
      showOptions: showOptions,
      controlsSafeAreaMinimum: controlsSafeAreaMinimum,
      autoPlay: autoPlay,
      allowFullScreen: allowFullScreen,
      customControls: customControls,
      hideControlsTimer: hideControlsTimer,
      showControlsOnInitialize: showControlsOnInitialize,
      showControls: showControls,
      loopVideo: loopVideo,
      allowedScreenSleep: allowedScreenSleep,
      onPlaying: onPlaying,
      onPaused: onPaused,
      onVideoEnded: onVideoEnded,
    ),
  );
}

class _ChewieControllerHook extends Hook<ChewieController> {
  final VideoPlayerController controller;
  final EdgeInsets controlsSafeAreaMinimum;
  final bool showOptions;
  final bool showControlsOnInitialize;
  final bool autoPlay;
  final bool allowFullScreen;
  final bool allowedScreenSleep;
  final bool showControls;
  final bool loopVideo;
  final Widget? customControls;
  final Widget? placeholder;
  final Duration hideControlsTimer;
  final VoidCallback? onPlaying;
  final VoidCallback? onPaused;
  final VoidCallback? onVideoEnded;

  const _ChewieControllerHook({
    required this.controller,
    this.controlsSafeAreaMinimum = const EdgeInsets.only(
      bottom: 100,
    ),
    this.showOptions = true,
    this.showControlsOnInitialize = false,
    this.autoPlay = true,
    this.allowFullScreen = false,
    this.allowedScreenSleep = false,
    this.showControls = true,
    this.loopVideo = false,
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
    extends HookState<ChewieController, _ChewieControllerHook> {
  late ChewieController chewieController = ChewieController(
    videoPlayerController: hook.controller,
    controlsSafeAreaMinimum: hook.controlsSafeAreaMinimum,
    showOptions: hook.showOptions,
    showControlsOnInitialize: hook.showControlsOnInitialize,
    autoPlay: hook.autoPlay,
    allowFullScreen: hook.allowFullScreen,
    allowedScreenSleep: hook.allowedScreenSleep,
    showControls: hook.showControls,
    looping: hook.loopVideo,
    customControls: hook.customControls,
    placeholder: hook.placeholder,
    hideControlsTimer: hook.hideControlsTimer,
  );

  @override
  void dispose() {
    chewieController.dispose();
    super.dispose();
  }

  @override
  ChewieController build(BuildContext context) {
    return chewieController;
  }

  /*
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

    await videoPlayerController!.initialize();

    chewieController = ChewieController(
      videoPlayerController: videoPlayerController!,
      controlsSafeAreaMinimum: hook.controlsSafeAreaMinimum,
      showOptions: hook.showOptions,
      showControlsOnInitialize: hook.showControlsOnInitialize,
      autoPlay: hook.autoPlay,
      allowFullScreen: hook.allowFullScreen,
      allowedScreenSleep: hook.allowedScreenSleep,
      showControls: hook.showControls,
      customControls: hook.customControls,
      placeholder: hook.placeholder,
      hideControlsTimer: hook.hideControlsTimer,
    );
  }
  */
}
