import 'dart:io';

import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:chewie/chewie.dart';
import 'package:immich_mobile/modules/asset_viewer/models/image_viewer_page_state.model.dart';
import 'package:immich_mobile/modules/asset_viewer/providers/image_viewer_page_state.provider.dart';
import 'package:immich_mobile/modules/asset_viewer/ui/video_player_controls.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/shared/ui/immich_loading_indicator.dart';
import 'package:photo_manager/photo_manager.dart';
import 'package:video_player/video_player.dart';
import 'package:wakelock/wakelock.dart';

// ignore: must_be_immutable
class VideoViewerPage extends HookConsumerWidget {
  final Asset asset;
  final bool isMotionVideo;
  final Widget? placeholder;
  final VoidCallback onVideoEnded;
  final VoidCallback? onPlaying;
  final VoidCallback? onPaused;

  const VideoViewerPage({
    Key? key,
    required this.asset,
    required this.isMotionVideo,
    required this.onVideoEnded,
    this.onPlaying,
    this.onPaused,
    this.placeholder,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (asset.isLocal && asset.livePhotoVideoId == null) {
      final AsyncValue<File> videoFile = ref.watch(_fileFamily(asset.local!));
      return videoFile.when(
        data: (data) => VideoPlayer(
          file: data,
          isMotionVideo: false,
          onVideoEnded: () {},
        ),
        error: (error, stackTrace) => Icon(
          Icons.image_not_supported_outlined,
          color: Theme.of(context).primaryColor,
        ),
        loading: () => const Center(
          child: SizedBox(
            width: 75,
            height: 75,
            child: CircularProgressIndicator.adaptive(),
          ),
        ),
      );
    }
    final downloadAssetStatus =
        ref.watch(imageViewerStateProvider).downloadAssetStatus;
    final String videoUrl = isMotionVideo
        ? '${Store.get(StoreKey.serverEndpoint)}/asset/file/${asset.livePhotoVideoId}'
        : '${Store.get(StoreKey.serverEndpoint)}/asset/file/${asset.remoteId}';

    return Stack(
      children: [
        VideoPlayer(
          url: videoUrl,
          jwtToken: Store.get(StoreKey.accessToken),
          isMotionVideo: isMotionVideo,
          onVideoEnded: onVideoEnded,
          onPaused: onPaused,
          onPlaying: onPlaying,
          placeholder: placeholder,
        ),
        if (downloadAssetStatus == DownloadAssetStatus.loading)
          SizedBox(
            height: MediaQuery.of(context).size.height,
            width: MediaQuery.of(context).size.width,
            child: const Center(
              child: ImmichLoadingIndicator(),
            ),
          ),
      ],
    );
  }
}

final _fileFamily =
    FutureProvider.family<File, AssetEntity>((ref, entity) async {
  final file = await entity.file;
  if (file == null) {
    throw Exception();
  }
  return file;
});

class VideoPlayer extends StatefulWidget {
  final String? url;
  final String? jwtToken;
  final File? file;
  final bool isMotionVideo;
  final VoidCallback onVideoEnded;

  final Function()? onPlaying;
  final Function()? onPaused;

  /// The placeholder to show while the video is loading
  /// usually, a thumbnail of the video
  final Widget? placeholder;

  const VideoPlayer({
    Key? key,
    this.url,
    this.jwtToken,
    this.file,
    required this.onVideoEnded,
    required this.isMotionVideo,
    this.onPlaying,
    this.onPaused,
    this.placeholder,
  }) : super(key: key);

  @override
  State<VideoPlayer> createState() => _VideoPlayerState();
}

class _VideoPlayerState extends State<VideoPlayer> {
  late VideoPlayerController videoPlayerController;
  ChewieController? chewieController;

  @override
  void initState() {
    super.initState();
    initializePlayer();

    videoPlayerController.addListener(() {
      if (videoPlayerController.value.isInitialized) {
        if (videoPlayerController.value.isPlaying) {
          Wakelock.enable();
          widget.onPlaying?.call();
        } else if (!videoPlayerController.value.isPlaying) {
          Wakelock.disable();
          widget.onPaused?.call();
        }

        if (videoPlayerController.value.position ==
            videoPlayerController.value.duration) {
          Wakelock.disable();
          widget.onVideoEnded();
        }
      }
    });
  }

  Future<void> initializePlayer() async {
    try {
      videoPlayerController = widget.file == null
          ? VideoPlayerController.network(
              widget.url!,
              httpHeaders: {"Authorization": "Bearer ${widget.jwtToken}"},
            )
          : VideoPlayerController.file(widget.file!);

      await videoPlayerController.initialize();
      _createChewieController();
      setState(() {});
    } catch (e) {
      debugPrint("ERROR initialize video player $e");
    }
  }

  _createChewieController() {
    chewieController = ChewieController(
      controlsSafeAreaMinimum: const EdgeInsets.only(
        bottom: 100,
      ),
      showOptions: true,
      showControlsOnInitialize: false,
      videoPlayerController: videoPlayerController,
      autoPlay: true,
      autoInitialize: true,
      allowFullScreen: false,
      allowedScreenSleep: false,
      showControls: !widget.isMotionVideo,
      customControls: const VideoPlayerControls(),
      hideControlsTimer: const Duration(seconds: 5),
    );
  }

  @override
  void dispose() {
    super.dispose();
    videoPlayerController.pause();
    videoPlayerController.dispose();
    chewieController?.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (chewieController?.videoPlayerController.value.isInitialized == true) {
      return SizedBox(
        child: Chewie(
          controller: chewieController!,
        ),
      );
    } else {
      return SizedBox(
        height: MediaQuery.of(context).size.height,
        width: MediaQuery.of(context).size.width,
        child: Center(
          child: Stack(
            children: [
              if (widget.placeholder != null)
                widget.placeholder!,
              const Center(
                child: ImmichLoadingIndicator(),
              ),
            ],
          ),
        ),
      );
    }
  }
}
