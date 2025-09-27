import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/live_wallpaper_preferences.model.dart';
import 'package:immich_mobile/platform/wallpaper_api.g.dart';

class LiveWallpaperPlatformService {
  LiveWallpaperPlatformService(this._hostApi);

  final WallpaperHostApi _hostApi;

  Future<WallpaperStatusMessage> getStatus() {
    return _hostApi.getStatus();
  }

  Future<void> syncPreferences(LiveWallpaperPreferences preferences) {
    final message = WallpaperPreferencesMessage(
      enabled: preferences.enabled,
      personIds: preferences.personIds,
      rotationMinutes: preferences.rotationInterval.inMinutes,
      rotationMode: preferences.rotationMode.name,
      allowCellularData: preferences.allowCellularData,
    );
    return _hostApi.setPreferences(message);
  }

  Future<void> requestRefresh() => _hostApi.requestRefresh();

  Future<bool> openSystemPicker() => _hostApi.openSystemWallpaperPicker();
}

final liveWallpaperPlatformServiceProvider = Provider<LiveWallpaperPlatformService>((_) {
  return LiveWallpaperPlatformService(WallpaperHostApi());
});
