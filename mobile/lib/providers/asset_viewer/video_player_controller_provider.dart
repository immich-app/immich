import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/services/api.service.dart';
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
        ? '$serverEndpoint/assets/${asset.livePhotoVideoId}/video/playback'
        : '$serverEndpoint/assets/${asset.remoteId}/video/playback';

    final url = Uri.parse(videoUrl);
    controller = VideoPlayerController.networkUrl(
      url,
      httpHeaders: ApiService.getRequestHeaders(),
      videoPlayerOptions: asset.livePhotoVideoId != null
          ? VideoPlayerOptions(mixWithOthers: true)
          : VideoPlayerOptions(mixWithOthers: false),
    );
  }

  await controller.initialize();

  ref.onDispose(() {
    controller.dispose();
  });

  return controller;
}
