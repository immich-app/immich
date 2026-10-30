import 'package:pigeon/pigeon.dart';

@ConfigurePigeon(
  PigeonOptions(
    dartOut: 'lib/platform/asset_media_api.g.dart',
    swiftOut: 'ios/Runner/AssetMedia/AssetMedia.g.swift',
    swiftOptions: SwiftOptions(includeErrorClass: false),
    kotlinOut: 'android/app/src/main/kotlin/app/alextran/immich/media/AssetMedia.g.kt',
    kotlinOptions: KotlinOptions(package: 'app.alextran.immich.media'),
    dartOptions: DartOptions(),
    dartPackageName: 'immich_mobile',
  ),
)
const String kUnsupportedOs = 'UNSUPPORTED_OS';
const String kSaveError = 'SAVE_ERROR';

enum AssetMediaActionStatus { done, alreadyInState, notFound, failed }

class AssetMediaActionResult {
  final String id;
  final AssetMediaActionStatus status;

  const AssetMediaActionResult({required this.id, required this.status});
}

@HostApi()
abstract class AssetMediaApi {
  @async
  List<AssetMediaActionResult> trash(List<String> ids);

  @async
  List<AssetMediaActionResult> restore(List<String> ids);

  @async
  List<AssetMediaActionResult> delete(List<String> ids);

  @async
  String saveFile(String path, String name, bool isVideo, String? relativePath);

  /// Pairs a still and its video into a Live Photo. iOS Only - Android
  /// should use saveFile as both the video is already embedded in the still photo
  @async
  String saveLivePhoto(String imagePath, String videoPath, String name);
}
