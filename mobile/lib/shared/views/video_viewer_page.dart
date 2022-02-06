import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hive/hive.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:chewie/chewie.dart';
import 'package:video_player/video_player.dart';

class VideoViewerPage extends StatelessWidget {
  final String videoUrl;

  const VideoViewerPage({Key? key, required this.videoUrl}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    String jwtToken = Hive.box(userInfoBox).get(accessTokenKey);

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        leading: IconButton(
            onPressed: () {
              AutoRouter.of(context).pop();
            },
            icon: const Icon(Icons.arrow_back_ios)),
      ),
      body: Center(
        child: VideoThumbnailPlayer(
          url: videoUrl,
          jwtToken: jwtToken,
        ),
      ),
    );
  }
}

class VideoThumbnailPlayer extends StatefulWidget {
  final String url;
  final String? jwtToken;

  const VideoThumbnailPlayer({Key? key, required this.url, this.jwtToken}) : super(key: key);

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
      videoPlayerController =
          VideoPlayerController.network(widget.url, httpHeaders: {"Authorization": "Bearer ${widget.jwtToken}"});

      await videoPlayerController.initialize();
      _createChewieController();
      setState(() {});
    } catch (e) {
      debugPrint("ERROR initialize video player");
      print(e);
    }
  }

  _createChewieController() {
    chewieController = ChewieController(
      showOptions: true,
      showControlsOnInitialize: false,
      videoPlayerController: videoPlayerController,
      autoPlay: true,
      autoInitialize: false,
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
    return chewieController != null && chewieController!.videoPlayerController.value.isInitialized
        ? SizedBox(
            child: Chewie(
              controller: chewieController!,
            ),
          )
        : const SizedBox(
            width: 75,
            height: 75,
            child: CircularProgressIndicator.adaptive(
              strokeWidth: 2,
            ),
          );
  }
}
