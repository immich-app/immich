import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/live_wallpaper_preferences.model.dart';
import 'package:immich_mobile/domain/services/live_wallpaper_preferences.service.dart';
import 'package:immich_mobile/providers/infrastructure/store.provider.dart';
import 'package:immich_mobile/repositories/asset_api.repository.dart';
import 'package:immich_mobile/domain/services/live_wallpaper_asset.service.dart';

final liveWallpaperPreferencesServiceProvider = Provider<LiveWallpaperPreferencesService>((ref) {
  return LiveWallpaperPreferencesService(ref.watch(storeServiceProvider));
});

final liveWallpaperAssetServiceProvider = Provider<LiveWallpaperAssetService>((ref) {
  return LiveWallpaperAssetService(ref.watch(assetApiRepositoryProvider));
});

final liveWallpaperPreferencesProvider = StateNotifierProvider<LiveWallpaperPreferencesNotifier, LiveWallpaperPreferences>
    ((ref) {
  final service = ref.watch(liveWallpaperPreferencesServiceProvider);
  return LiveWallpaperPreferencesNotifier(service);
});

class LiveWallpaperPreferencesNotifier extends StateNotifier<LiveWallpaperPreferences> {
  LiveWallpaperPreferencesNotifier(this._service)
      : super(_service.load()) {
    _subscription = _service.watch().listen((event) {
      if (mounted) {
        state = event;
      }
    });
  }

  final LiveWallpaperPreferencesService _service;
  StreamSubscription<LiveWallpaperPreferences>? _subscription;

  Future<void> toggleEnabled(bool enabled) async {
    await _set(state.copyWith(enabled: enabled));
  }

  Future<void> setPersonIds(List<String> personIds) async {
    await _set(state.copyWith(personIds: List.unmodifiable(personIds)));
  }

  Future<void> setRotationInterval(Duration interval) async {
    await _set(state.copyWith(rotationInterval: interval));
  }

  Future<void> setRotationMode(RotationMode mode) async {
    await _set(state.copyWith(rotationMode: mode));
  }

  Future<void> setAllowCellular(bool allow) async {
    await _set(state.copyWith(allowCellularData: allow));
  }

  Future<void> setLastAsset(String? assetId, {DateTime? updatedAt}) async {
    await _set(state.copyWith(lastAssetId: assetId, lastUpdated: updatedAt));
  }

  Future<void> reset() async {
    await _set(const LiveWallpaperPreferences.defaults());
  }

  Future<void> _set(LiveWallpaperPreferences preferences) async {
    state = preferences;
    await _service.save(preferences);
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }
}
