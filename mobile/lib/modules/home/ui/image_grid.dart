import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/ui/thumbnail_image.dart';
import 'package:immich_mobile/shared/models/immich_asset.model.dart';

class ImageGrid extends ConsumerWidget {
  final List<ImmichAsset> assetGroup;

  const ImageGrid({Key? key, required this.assetGroup}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return SliverGrid(
      gridDelegate:
          const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 3, crossAxisSpacing: 5.0, mainAxisSpacing: 5),
      delegate: SliverChildBuilderDelegate(
        (BuildContext context, int index) {
          var assetType = assetGroup[index].type;

          return GestureDetector(
              onTap: () {},
              child: Stack(
                children: [
                  ThumbnailImage(asset: assetGroup[index]),
                  assetType == 'IMAGE'
                      ? Container()
                      : Positioned(
                          top: 5,
                          right: 5,
                          child: Row(
                            children: [
                              Text(
                                assetGroup[index].duration.toString().substring(0, 7),
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 10,
                                ),
                              ),
                              const Icon(
                                Icons.play_circle_outline_rounded,
                                color: Colors.white,
                              ),
                            ],
                          ),
                        )
                ],
              ));
        },
        childCount: assetGroup.length,
      ),
    );
  }
}

// class VideoThumbnailPlayer extends StatefulWidget {
//   ImmichAsset videoAsset;

//   VideoThumbnailPlayer({Key? key, required this.videoAsset}) : super(key: key);

//   @override
//   State<VideoThumbnailPlayer> createState() => _VideoThumbnailPlayerState();
// }

// class _VideoThumbnailPlayerState extends State<VideoThumbnailPlayer> {
//   late VideoPlayerController videoPlayerController;
//   ChewieController? chewieController;

//   @override
//   void initState() {
//     super.initState();
//     initializePlayer();
//   }

//   Future<void> initializePlayer() async {
//     videoPlayerController =
//         VideoPlayerController.network('https://flutter.github.io/assets-for-api-docs/assets/videos/butterfly.mp4');

//     await Future.wait([
//       videoPlayerController.initialize(),
//     ]);
//     _createChewieController();
//     setState(() {});
//   }

//   _createChewieController() {
//     chewieController = ChewieController(
//       showControlsOnInitialize: false,
//       videoPlayerController: videoPlayerController,
//       autoPlay: true,
//       looping: true,
//     );
//   }

//   @override
//   Widget build(BuildContext context) {
//     return chewieController != null && chewieController!.videoPlayerController.value.isInitialized
//         ? SizedBox(
//             height: 300,
//             width: 300,
//             child: Chewie(
//               controller: chewieController!,
//             ),
//           )
//         : const Text("Loading Video");
//   }
// }
