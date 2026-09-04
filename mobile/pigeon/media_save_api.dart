import 'package:pigeon/pigeon.dart';

@ConfigurePigeon(
  PigeonOptions(
    dartOut: 'lib/platform/media_save_api.g.dart',
    kotlinOut: 'android/app/src/main/kotlin/app/alextran/immich/mediasave/MediaSave.g.kt',
    kotlinOptions: KotlinOptions(package: 'app.alextran.immich.mediasave'),
    dartOptions: DartOptions(),
    dartPackageName: 'immich_mobile',
  ),
)
@HostApi()
abstract class MediaSaveApi {
  // Saves a file to a MediaStore Files-collection entry under [relativePath]
  // (e.g. Download/Immich). Fallback for when photo_manager can't save a file
  // because the platform has no MIME for it (e.g. raw like CR3) and MediaStore
  // rejects the `image/*` it falls back to; the Files collection accepts any
  // type. Returns the new media id, or null on failure.
  @async
  String? saveToDownloads(String filePath, String title, String? relativePath);
}
