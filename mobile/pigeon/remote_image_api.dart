import 'package:pigeon/pigeon.dart';

@ConfigurePigeon(
  PigeonOptions(
    dartOut: 'lib/platform/remote_image_api.g.dart',
    swiftOut: 'ios/Runner/Images/RemoteImages.g.swift',
    swiftOptions: SwiftOptions(includeErrorClass: false),
    kotlinOut:
        'android/app/src/main/kotlin/app/alextran/immich/images/RemoteImages.g.kt',
    kotlinOptions: KotlinOptions(package: 'app.alextran.immich.images', includeErrorClass: false),
    dartOptions: DartOptions(),
    dartPackageName: 'immich_mobile',
  ),
)
class NativeCacheStats {
  final int size;
  final int count;

  NativeCacheStats({required this.size, required this.count});
}

class DualCacheStats {
  final int thumbnailSize;
  final int thumbnailCount;
  final int highResSize;
  final int highResCount;

  DualCacheStats({
    required this.thumbnailSize,
    required this.thumbnailCount,
    required this.highResSize,
    required this.highResCount,
  });
}

@HostApi()
abstract class RemoteImageApi {
  @async
  Map<String, int>? requestImage(
    String url, {
    required Map<String, String> headers,
    required int requestId,
    required bool isThumbnail,
  });

  void cancelRequest(int requestId);

  @async
  int clearThumbnailCache();

  @async
  int clearHighResCache();

  @async
  DualCacheStats getDualCacheStats();

  @async
  int cleanupExpiredHighRes(int maxAgeDays);
}
