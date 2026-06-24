import 'dart:convert';
import 'dart:io';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/settings_key.dart';
import 'package:immich_mobile/infrastructure/repositories/settings.repository.dart';
import 'package:immich_mobile/platform/dynamic_wallpaper_api.g.dart';
import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_mobile/repositories/widget.repository.dart';

final dynamicWallpaperServiceProvider = Provider(
  (ref) => DynamicWallpaperService(
    ref.watch(settingsProvider),
    ref.watch(widgetRepositoryProvider),
    ref.watch(dynamicWallpaperApiProvider),
  ),
);

class DynamicWallpaperService {
  final SettingsRepository _settingsRepository;
  final WidgetRepository _widgetRepository;
  final DynamicWallpaperApi _api;

  const DynamicWallpaperService(this._settingsRepository, this._widgetRepository, this._api);

  List<String> remoteImageIdsFromAssets(Iterable<BaseAsset> assets) {
    return assets
        .where((asset) => asset.isImage && asset.hasRemote)
        .map((asset) => asset.remoteId)
        .nonNulls
        .toSet()
        .toList();
  }

  Future<void> saveSelection(Iterable<BaseAsset> assets) {
    return configure(assetIds: remoteImageIdsFromAssets(assets));
  }

  Future<void> configure({List<String>? assetIds, int? intervalMinutes}) async {
    final current = _settingsRepository.appConfig.dynamicWallpaper;
    final nextAssetIds = assetIds ?? current.assetIds;
    final nextIntervalMinutes = intervalMinutes ?? current.intervalMinutes;

    await _settingsRepository.write(SettingsKey.dynamicWallpaperAssetIds, nextAssetIds);
    await _settingsRepository.write(SettingsKey.dynamicWallpaperIntervalMinutes, nextIntervalMinutes);
    await _writeSharedConfig(nextAssetIds, nextIntervalMinutes);

    if (Platform.isAndroid) {
      await _api.configure(nextAssetIds, nextIntervalMinutes);
    }
  }

  Future<void> clearSelection() => configure(assetIds: []);

  Future<void> openPicker() async {
    if (Platform.isAndroid) {
      await _api.openLiveWallpaperPicker();
    }
  }

  Future<void> _writeSharedConfig(List<String> assetIds, int intervalMinutes) async {
    await _widgetRepository.setAppGroupId();
    await _widgetRepository.saveData(kDynamicWallpaperAssetIds, jsonEncode(assetIds));
    await _widgetRepository.saveData(kDynamicWallpaperIntervalMinutes, intervalMinutes.toString());
  }
}
