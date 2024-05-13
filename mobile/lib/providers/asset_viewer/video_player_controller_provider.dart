import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:video_player/video_player.dart';

part 'video_player_controller_provider.g.dart';

@riverpod
Future<VideoPlayerController> videoPlayerController(
  VideoPlayerControllerRef ref, {
  required Asset asset,
}) async {
  late VideoPlayerController controller;
  if (asset.isLocal && asset.livePhotoVideoId == null) {
    // Use a local file for the video player controller
    final file = await asset.local!.file;
    if (file == null) {
      throw Exception('No file found for the video');
    }
    controller = VideoPlayerController.file(file);
  } else {
    // Use a network URL for the video player controller
    final serverEndpoint = Store.get(StoreKey.serverEndpoint);
    final String videoUrl = asset.livePhotoVideoId != null
        ? '$serverEndpoint/asset/file/${asset.livePhotoVideoId}'
        : '$serverEndpoint/asset/file/${asset.remoteId}';

    final url = Uri.parse(videoUrl);
    final accessToken = Store.get(StoreKey.accessToken);

    controller = VideoPlayerController.networkUrl(
      url,
      httpHeaders: {"x-immich-user-token": accessToken},
    );
  }

  await controller.initialize();

  ref.onDispose(() {
    controller.dispose();
  });

  return controller;
}
