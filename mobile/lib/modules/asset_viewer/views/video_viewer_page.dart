import 'package:flutter/material.dart';
import 'package:hive/hive.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:chewie/chewie.dart';
import 'package:immich_mobile/modules/asset_viewer/models/image_viewer_page_state.model.dart';
import 'package:immich_mobile/modules/asset_viewer/providers/image_viewer_page_state.provider.dart';
import 'package:immich_mobile/modules/asset_viewer/ui/download_loading_indicator.dart';
import 'package:openapi/api.dart';
import 'package:video_player/video_player.dart';

// ignore: must_be_immutable
class VideoViewerPage extends HookConsumerWidget {
  final String videoUrl;
  final AssetResponseDto asset;
  AssetResponseDto? assetDetail;

  VideoViewerPage({Key? key, required this.videoUrl, required this.asset})
      : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final downloadAssetStatus =
        ref.watch(imageViewerStateProvider).downloadAssetStatus;

    String jwtToken = Hive.box(userInfoBox).get(accessTokenKey);

    return Stack(
      children: [
        VideoThumbnailPlayer(
          url: videoUrl,
          jwtToken: jwtToken,
        ),
        if (downloadAssetStatus == DownloadAssetStatus.loading)
          const Center(
            child: DownloadLoadingIndicator(),
          ),
      ],
    );
  }
}

class VideoThumbnailPlayer extends StatefulWidget {
  final String url;
  final String? jwtToken;

  const VideoThumbnailPlayer({Key? key, required this.url, this.jwtToken})
      : super(key: key);

  @override
  State<VideoThumbnailPlayer> createState() => _VideoThumbnailPlayerState();
}

class _VideoThumbnailPlayerState extends State<VideoThumbnailPlayer> {
  late VideoPlayerController videoPlayerController;
  ChewieController? chewieController;

  @override
  void initState() {
    super.initState();
    initializePlayer();
  }

  Future<void> initializePlayer() async {
    try {
      videoPlayerController = VideoPlayerController.network(
        widget.url,
        httpHeaders: {"Authorization": "Bearer ${widget.jwtToken}"},
      );

      await videoPlayerController.initialize();
      _createChewieController();
      setState(() {});
    } catch (e) {
      debugPrint("ERROR initialize video player");
    }
  }

  _createChewieController() {
    chewieController = ChewieController(
      showOptions: true,
      showControlsOnInitialize: false,
      videoPlayerController: videoPlayerController,
      autoPlay: true,
      autoInitialize: true,
      allowFullScreen: true,
      showControls: true,
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
    return chewieController?.videoPlayerController.value.isInitialized == true
        ? SizedBox(
            child: Chewie(
              controller: chewieController!,
            ),
          )
        : const Center(
            child: SizedBox(
              width: 75,
              height: 75,
              child: CircularProgressIndicator.adaptive(
                strokeWidth: 2,
              ),
            ),
          );
  }
}
