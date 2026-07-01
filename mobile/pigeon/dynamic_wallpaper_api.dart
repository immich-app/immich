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
  void configure(List<DynamicWallpaperAssetRef> assets);

  @async
  void openLiveWallpaperPicker();

  @async
  void refresh(List<DynamicWallpaperAssetRef> assets);

  @async
  void updateSelection(List<DynamicWallpaperAssetRef> assets, List<String> forcePrepareIds, bool prepareMissing);

  @async
  void disable();

  @async
  DynamicWallpaperStatus getStatus();
}

class DynamicWallpaperAssetRef {
  final String remoteId;
  final String? localId;
  final bool isEdited;
  final DynamicWallpaperAssetLayout? layout;

  const DynamicWallpaperAssetRef({required this.remoteId, this.localId, required this.isEdited, this.layout});
}

class DynamicWallpaperAssetLayout {
  final int rotationDegrees;
  final double cropLeft;
  final double cropTop;
  final double cropRight;
  final double cropBottom;

  const DynamicWallpaperAssetLayout({
    required this.rotationDegrees,
    required this.cropLeft,
    required this.cropTop,
    required this.cropRight,
    required this.cropBottom,
  });
}

class DynamicWallpaperStatus {
  final bool enabled;
  final int selectedCount;
  final int preparedCount;
  final int missingCount;
  final int failedCount;
  final String? lastError;

  const DynamicWallpaperStatus({
    required this.enabled,
    required this.selectedCount,
    required this.preparedCount,
    required this.missingCount,
    required this.failedCount,
    this.lastError,
  });
}
