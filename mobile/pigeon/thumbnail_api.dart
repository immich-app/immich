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
  Uint8List getThumbnail(
    String assetId, {
    required int width,
    required int height,
  });

  // @async
  // int requestThumbnail(
  //   String assetId, {
  //   required int width,
  //   required int height,
  //   void Function(int requestId) onDone,
  // });
}

// @FlutterApi()
// abstract class PlatformThumbnailApi {
//   @async
//   Uint8List? getThumbnail(String assetId, int width, int height);
// }
