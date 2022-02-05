import 'package:chewie/chewie.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/modules/home/ui/thumbnail_image.dart';
import 'package:immich_mobile/shared/models/immich_asset.model.dart';
import 'package:video_player/video_player.dart';

class ImageGrid extends StatelessWidget {
  final List<ImmichAsset> assetGroup;

  const ImageGrid({Key? key, required this.assetGroup}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return SliverGrid(
      gridDelegate:
          const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 3, crossAxisSpacing: 5.0, mainAxisSpacing: 5),
      delegate: SliverChildBuilderDelegate(
        (BuildContext context, int index) {
          var assetType = assetGroup[index].type;

          return GestureDetector(
            onTap: () {},
            child: assetType == 'IMAGE'
                ? ThumbnailImage(asset: assetGroup[index])
                : VideoThumbnailPlayer(key: Key(assetGroup[index].id), videoAsset: assetGroup[index]),
          );
        },
        childCount: assetGroup.length,
      ),
    );
  }
}

class VideoThumbnailPlayer extends StatefulWidget {
  ImmichAsset videoAsset;

  VideoThumbnailPlayer({Key? key, required this.videoAsset}) : super(key: key);

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
    videoPlayerController =
        VideoPlayerController.network('https://flutter.github.io/assets-for-api-docs/assets/videos/butterfly.mp4');

    await Future.wait([
      videoPlayerController.initialize(),
    ]);
    _createChewieController();
    setState(() {});
  }

  _createChewieController() {
    chewieController = ChewieController(
      showControlsOnInitialize: false,
      videoPlayerController: videoPlayerController,
      autoPlay: true,
      looping: true,
    );
  }

  @override
  Widget build(BuildContext context) {
    return chewieController != null && chewieController!.videoPlayerController.value.isInitialized
        ? SizedBox(
            height: 300,
            width: 300,
            child: Chewie(
              controller: chewieController!,
            ),
          )
        : const Text("Loading Video");
  }
}
