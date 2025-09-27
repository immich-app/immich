import 'package:pigeon/pigeon.dart';

@ConfigurePigeon(
  PigeonOptions(
    dartOut: 'lib/platform/wallpaper_api.g.dart',
    kotlinOut: 'android/app/src/main/kotlin/app/alextran/immich/wallpaper/WallpaperApi.g.kt',
    kotlinOptions: KotlinOptions(package: 'app.alextran.immich.wallpaper'),
    dartOptions: DartOptions(),
    dartPackageName: 'immich_mobile',
  ),
)
class WallpaperPreferencesMessage {
  final bool enabled;
  final List<String> personIds;
  final int rotationMinutes;
  final String rotationMode;
  final bool allowCellularData;

  const WallpaperPreferencesMessage({
    required this.enabled,
    required this.personIds,
    required this.rotationMinutes,
    required this.rotationMode,
    required this.allowCellularData,
  });
}

class WallpaperStatusMessage {
  final bool isSupported;
  final bool isActive;
  final String? lastError;

  const WallpaperStatusMessage({
    this.isSupported = true,
    this.isActive = false,
    this.lastError,
  });
}

@HostApi()
abstract class WallpaperHostApi {
  WallpaperStatusMessage getStatus();

  void setPreferences(WallpaperPreferencesMessage preferences);

  void requestRefresh();

  bool openSystemWallpaperPicker();
}
