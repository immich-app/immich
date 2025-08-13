import 'package:pigeon/pigeon.dart';

@ConfigurePigeon(
  PigeonOptions(
    dartOut: 'lib/platform/thumbnail_api.g.dart',
    swiftOut: 'ios/Runner/Images/Thumbnails.g.swift',
    swiftOptions: SwiftOptions(includeErrorClass: false),
    kotlinOut:
        'android/app/src/main/kotlin/app/alextran/immich/images/Thumbnails.g.kt',
    kotlinOptions: KotlinOptions(package: 'app.alextran.immich.images'),
    dartOptions: DartOptions(),
    dartPackageName: 'immich_mobile',
  ),
)
@HostApi()
abstract class ThumbnailApi {
  @async
  Map<String, int> requestImage(
    String assetId, {
    required int requestId,
    required int width,
    required int height,
    required bool isVideo,
  });

  void cancelImageRequest(int requestId);

  @async
  Map<String, int> getThumbhash(String thumbhash);
}
