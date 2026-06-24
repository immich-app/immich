import 'package:pigeon/pigeon.dart';

@ConfigurePigeon(
  PigeonOptions(
    dartOut: 'lib/platform/dynamic_wallpaper_api.g.dart',
    kotlinOut: 'android/app/src/main/kotlin/app/alextran/immich/wallpaper/DynamicWallpaper.g.kt',
    kotlinOptions: KotlinOptions(package: 'app.alextran.immich.wallpaper', includeErrorClass: true),
    dartOptions: DartOptions(),
    dartPackageName: 'immich_mobile',
  ),
)
@HostApi()
abstract class DynamicWallpaperApi {
  @async
  void configure(List<String> assetIds, int intervalMinutes);

  @async
  void openLiveWallpaperPicker();

  @async
  void refresh();
}
