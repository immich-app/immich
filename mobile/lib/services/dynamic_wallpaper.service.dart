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

class DynamicWallpaperSelectionUpdate {
  final List<String> assetIds;
  final int addedCount;
  final int skippedCount;

  const DynamicWallpaperSelectionUpdate({
    required this.assetIds,
    required this.addedCount,
    required this.skippedCount,
  });
}

class DynamicWallpaperService {
  final SettingsRepository _settingsRepository;
  final WidgetRepository _widgetRepository;
  final DynamicWallpaperApi _api;

  const DynamicWallpaperService(this._settingsRepository, this._widgetRepository, this._api);

  static List<String> remoteImageIdsFrom(Iterable<BaseAsset> assets) {
    return assets
        .where((asset) => asset.isImage && asset.hasRemote)
        .map((asset) => asset.remoteId)
        .nonNulls
        .toSet()
        .toList();
  }

  static DynamicWallpaperSelectionUpdate addMissingAssetIds(
    List<String> currentAssetIds,
    Iterable<String> selectedAssetIds,
  ) {
    final current = currentAssetIds.toSet();
    final selected = selectedAssetIds.toSet();
    final added = selected.where((assetId) => !current.contains(assetId)).toList();

    return DynamicWallpaperSelectionUpdate(
      assetIds: [...currentAssetIds, ...added],
      addedCount: added.length,
      skippedCount: selected.length - added.length,
    );
  }

  static List<String> removeAssetIds(List<String> currentAssetIds, Iterable<String> removedAssetIds) {
    final removed = removedAssetIds.toSet();
    return currentAssetIds.where((assetId) => !removed.contains(assetId)).toList();
  }

  static List<String> reorderAssetIds(List<String> currentAssetIds, int oldIndex, int newIndex) {
    final nextAssetIds = [...currentAssetIds];
    final adjustedNewIndex = oldIndex < newIndex ? newIndex - 1 : newIndex;
    final assetId = nextAssetIds.removeAt(oldIndex);
    nextAssetIds.insert(adjustedNewIndex, assetId);
    return nextAssetIds;
  }

  List<String> remoteImageIdsFromAssets(Iterable<BaseAsset> assets) => remoteImageIdsFrom(assets);

  Future<void> saveSelection(Iterable<BaseAsset> assets) {
    return configure(assetIds: remoteImageIdsFromAssets(assets));
  }

  Future<DynamicWallpaperSelectionUpdate> addSelection(Iterable<BaseAsset> assets) async {
    final selectedAssetIds = remoteImageIdsFromAssets(assets);
    final update = addMissingAssetIds(_settingsRepository.appConfig.dynamicWallpaper.assetIds, selectedAssetIds);

    if (update.addedCount > 0) {
      await configure(assetIds: update.assetIds);
    }

    return update;
  }

  Future<void> removeSelection(Iterable<String> assetIds) {
    final nextAssetIds = removeAssetIds(_settingsRepository.appConfig.dynamicWallpaper.assetIds, assetIds);
    return configure(assetIds: nextAssetIds);
  }

  Future<void> reorderSelection(int oldIndex, int newIndex) {
    final nextAssetIds = reorderAssetIds(_settingsRepository.appConfig.dynamicWallpaper.assetIds, oldIndex, newIndex);
    return configure(assetIds: nextAssetIds);
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
