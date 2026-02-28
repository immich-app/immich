import 'package:pigeon/pigeon.dart';

@ConfigurePigeon(
  PigeonOptions(
    dartOut: 'lib/platform/local_image_api.g.dart',
    swiftOut: 'ios/Runner/Images/LocalImages.g.swift',
    swiftOptions: SwiftOptions(includeErrorClass: false),
    kotlinOut:
        'android/app/src/main/kotlin/app/alextran/immich/images/LocalImages.g.kt',
    kotlinOptions: KotlinOptions(package: 'app.alextran.immich.images'),
    dartOptions: DartOptions(),
    dartPackageName: 'immich_mobile',
  ),
)
@HostApi()
abstract class LocalImageApi {
  @async
  Map<String, int>? requestImage(
    String assetId, {
    required int requestId,
    required int width,
    required int height,
    required bool isVideo,
    required bool preferEncoded,
  });

  void cancelRequest(int requestId);

  @async
  Map<String, int> getThumbhash(String thumbhash);
}
