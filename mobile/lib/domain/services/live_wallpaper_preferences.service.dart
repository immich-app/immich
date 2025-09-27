import 'dart:async';

import 'package:immich_mobile/domain/models/live_wallpaper_preferences.model.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';

class LiveWallpaperPreferencesService {
  LiveWallpaperPreferencesService(this._storeService);

  final StoreService _storeService;

  LiveWallpaperPreferences load() {
    final raw = _storeService.tryGet(StoreKey.wallpaperPreferences);
    return LiveWallpaperPreferences.decode(raw);
  }

  Future<void> save(LiveWallpaperPreferences preferences) {
    return _storeService.put(StoreKey.wallpaperPreferences, preferences.encode());
  }

  Stream<LiveWallpaperPreferences> watch() {
    return _storeService.watch(StoreKey.wallpaperPreferences).map(LiveWallpaperPreferences.decode);
  }
}
