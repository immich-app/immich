import 'dart:io';

import 'package:flutter/material.dart';
import 'package:hive/hive.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:chewie/chewie.dart';
import 'package:immich_mobile/modules/asset_viewer/models/image_viewer_page_state.model.dart';
import 'package:immich_mobile/modules/asset_viewer/providers/image_viewer_page_state.provider.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/ui/immich_loading_indicator.dart';
import 'package:photo_manager/photo_manager.dart';
import 'package:video_player/video_player.dart';

// ignore: must_be_immutable
class VideoViewerPage extends HookConsumerWidget {
  final Asset asset;

  const VideoViewerPage({Key? key, required this.asset}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (asset.isLocal) {
      final AsyncValue<File> videoFile = ref.watch(_fileFamily(asset.local!));
      return videoFile.when(
        data: (data) => VideoThumbnailPlayer(file: data),
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
    final box = Hive.box(userInfoBox);
    final String jwtToken = box.get(accessTokenKey);
    final String videoUrl =
        '${box.get(serverEndpointKey)}/asset/file?aid=${asset.deviceAssetId}&did=${asset.deviceId}';

    return Stack(
      children: [
        VideoThumbnailPlayer(
          url: videoUrl,
          jwtToken: jwtToken,
        ),
        if (downloadAssetStatus == DownloadAssetStatus.loading)
          const Center(
            child: ImmichLoadingIndicator(),
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

class VideoThumbnailPlayer extends StatefulWidget {
  final String? url;
  final String? jwtToken;
  final File? file;

  const VideoThumbnailPlayer({Key? key, this.url, this.jwtToken, this.file})
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
