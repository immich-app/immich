import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/live_wallpaper_preferences.provider.dart';
import 'package:immich_mobile/services/live_wallpaper_platform.service.dart';
import 'package:immich_mobile/platform/wallpaper_api.g.dart';

final liveWallpaperStatusProvider = FutureProvider<WallpaperStatusMessage>((ref) async {
  final preferences = ref.watch(liveWallpaperPreferencesProvider);
  final platformService = ref.watch(liveWallpaperPlatformServiceProvider);
  await platformService.syncPreferences(preferences);
  return platformService.getStatus();
});

final openWallpaperPickerProvider = Provider<Future<bool> Function()>((ref) {
  final platformService = ref.watch(liveWallpaperPlatformServiceProvider);
  return () => platformService.openSystemPicker();
});

final requestWallpaperRefreshProvider = Provider<Future<void> Function()>((ref) {
  final platformService = ref.watch(liveWallpaperPlatformServiceProvider);
  return () => platformService.requestRefresh();
});
