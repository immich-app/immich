import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/config/dynamic_wallpaper_config.dart' as config_model;
import 'package:immich_mobile/domain/models/settings_key.dart';
import 'package:immich_mobile/domain/services/asset.service.dart';
import 'package:immich_mobile/infrastructure/repositories/settings.repository.dart';
import 'package:immich_mobile/platform/dynamic_wallpaper_api.g.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';

final dynamicWallpaperServiceProvider = Provider(
  (ref) => DynamicWallpaperService(
    ref.watch(settingsProvider),
    ref.watch(dynamicWallpaperApiProvider),
    assetService: ref.watch(assetServiceProvider),
  ),
);

class DynamicWallpaperSelectionUpdate {
  final List<String> assetIds;
  final int addedCount;
  final int skippedCount;

  const DynamicWallpaperSelectionUpdate({required this.assetIds, required this.addedCount, required this.skippedCount});
}

class DynamicWallpaperService {
  final SettingsRepository _settingsRepository;
  final DynamicWallpaperApi _api;
  final AssetService? assetService;
  final bool _isAndroid;

  DynamicWallpaperService(this._settingsRepository, this._api, {this.assetService, bool? isAndroid})
    : _isAndroid = isAndroid ?? Platform.isAndroid;

  static List<String> remoteImageIdsFrom(Iterable<BaseAsset> assets) {
    return deduplicatePreservingOrder(
      assets.where((asset) => asset.isImage && asset.hasRemote).map((asset) => asset.remoteId).nonNulls,
    );
  }

  static List<String> deduplicatePreservingOrder(Iterable<String> assetIds) {
    final seen = <String>{};
    final result = <String>[];

    for (final assetId in assetIds) {
      if (assetId.isNotEmpty && seen.add(assetId)) {
        result.add(assetId);
      }
    }

    return result;
  }

  static DynamicWallpaperSelectionUpdate addMissingAssetIds(
    List<String> currentAssetIds,
    Iterable<String> selectedAssetIds,
  ) {
    final current = currentAssetIds.toSet();
    final selected = deduplicatePreservingOrder(selectedAssetIds);
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

  static List<String> replaceAssetIdsFromSelection({
    required List<String> currentAssetIds,
    required Iterable<String> selectedAssetIds,
    Iterable<String> preservedAssetIds = const [],
  }) {
    final selected = deduplicatePreservingOrder(selectedAssetIds);
    final selectedSet = selected.toSet();
    final preservedSet = preservedAssetIds.toSet();
    final retained = currentAssetIds
        .where((assetId) => selectedSet.contains(assetId) || preservedSet.contains(assetId))
        .toList();
    final retainedSet = retained.toSet();
    final added = selected.where((assetId) => !retainedSet.contains(assetId));

    return deduplicatePreservingOrder([...retained, ...added]);
  }

  static List<String> reorderAssetIds(List<String> currentAssetIds, int oldIndex, int newIndex) {
    final nextAssetIds = [...currentAssetIds];
    final adjustedNewIndex = oldIndex < newIndex ? newIndex - 1 : newIndex;
    final assetId = nextAssetIds.removeAt(oldIndex);
    nextAssetIds.insert(adjustedNewIndex, assetId);
    return nextAssetIds;
  }

  static Map<String, config_model.DynamicWallpaperAssetLayout> pruneAssetLayouts(
    Map<String, config_model.DynamicWallpaperAssetLayout> currentLayouts,
    Iterable<String> assetIds,
  ) {
    final retainedIds = assetIds.toSet();
    return {
      for (final entry in currentLayouts.entries)
        if (retainedIds.contains(entry.key) && !entry.value.isIdentity) entry.key: entry.value.normalized(),
    };
  }

  List<String> remoteImageIdsFromAssets(Iterable<BaseAsset> assets) => remoteImageIdsFrom(assets);

  Future<DynamicWallpaperSelectionUpdate> addSelection(Iterable<BaseAsset> assets) async {
    final selectedAssetIds = remoteImageIdsFromAssets(assets);
    final update = addMissingAssetIds(_settingsRepository.appConfig.dynamicWallpaper.assetIds, selectedAssetIds);

    if (update.addedCount > 0) {
      await configure(assetIds: update.assetIds);
    }

    return update;
  }

  Future<List<String>> replaceSelection(
    Iterable<BaseAsset> assets, {
    Iterable<String> preservedAssetIds = const [],
  }) async {
    final selectedAssetIds = remoteImageIdsFromAssets(assets);
    final nextAssetIds = replaceAssetIdsFromSelection(
      currentAssetIds: _settingsRepository.appConfig.dynamicWallpaper.assetIds,
      selectedAssetIds: selectedAssetIds,
      preservedAssetIds: preservedAssetIds,
    );

    await configure(assetIds: nextAssetIds);
    return nextAssetIds;
  }

  Future<void> removeSelection(Iterable<String> assetIds) {
    final current = _settingsRepository.appConfig.dynamicWallpaper;
    final nextAssetIds = removeAssetIds(current.assetIds, assetIds);
    return configure(assetIds: nextAssetIds, assetLayouts: pruneAssetLayouts(current.assetLayouts, nextAssetIds));
  }

  Future<void> reorderSelection(int oldIndex, int newIndex) async {
    final current = _settingsRepository.appConfig.dynamicWallpaper;
    final previousAssetIds = current.assetIds;
    final nextAssetIds = reorderAssetIds(previousAssetIds, oldIndex, newIndex);

    await _settingsRepository.write(SettingsKey.dynamicWallpaperAssetIds, nextAssetIds);

    try {
      if (_isAndroid) {
        await _api.updateSelection(await _assetRefsFor(nextAssetIds, resolveAssets: false), const [], false);
      }
    } catch (_) {
      await _settingsRepository.write(SettingsKey.dynamicWallpaperAssetIds, previousAssetIds);
      rethrow;
    }
  }

  Future<void> configure({
    List<String>? assetIds,
    Map<String, config_model.DynamicWallpaperAssetLayout>? assetLayouts,
  }) async {
    final current = _settingsRepository.appConfig.dynamicWallpaper;
    final nextAssetIds = deduplicatePreservingOrder(assetIds ?? current.assetIds);
    final nextAssetLayouts = pruneAssetLayouts(assetLayouts ?? current.assetLayouts, nextAssetIds);

    if (_isAndroid) {
      await _api.configure(await _assetRefsFor(nextAssetIds, layouts: nextAssetLayouts));
    }

    await _settingsRepository.write(SettingsKey.dynamicWallpaperAssetIds, nextAssetIds);
    if (!mapEquals(current.assetLayouts, nextAssetLayouts)) {
      await _settingsRepository.write(SettingsKey.dynamicWallpaperAssetLayouts, nextAssetLayouts);
    }
  }

  Future<void> clearSelection() => configure(assetIds: []);

  Future<void> updateLayout(String assetId, config_model.DynamicWallpaperAssetLayout layout) async {
    final current = _settingsRepository.appConfig.dynamicWallpaper;
    if (!current.assetIds.contains(assetId)) {
      return;
    }

    final normalizedLayout = layout.normalized();
    final nextLayouts = {...current.assetLayouts, assetId: normalizedLayout};

    if (normalizedLayout.isIdentity) {
      nextLayouts.remove(assetId);
    }

    final prunedLayouts = pruneAssetLayouts(nextLayouts, current.assetIds);
    if (_isAndroid) {
      await _api.updateSelection(await _assetRefsFor(current.assetIds, layouts: prunedLayouts), [assetId], false);
    }

    await _settingsRepository.write(SettingsKey.dynamicWallpaperAssetLayouts, prunedLayouts);
  }

  Future<void> openPicker() async {
    if (_isAndroid) {
      await _api.openLiveWallpaperPicker();
    }
  }

  Future<void> refreshPreparedWallpapers() async {
    if (_isAndroid) {
      final currentAssetIds = _settingsRepository.appConfig.dynamicWallpaper.assetIds;
      await _api.refresh(await _assetRefsFor(currentAssetIds));
    }
  }

  Future<void> disable() async {
    if (_isAndroid) {
      await _api.disable();
    }
  }

  Future<DynamicWallpaperStatus> getPreparationStatus() async {
    if (_isAndroid) {
      return _api.getStatus();
    }

    final selectedCount = _settingsRepository.appConfig.dynamicWallpaper.assetIds.length;
    return DynamicWallpaperStatus(
      enabled: false,
      selectedCount: selectedCount,
      preparedCount: 0,
      missingCount: selectedCount,
      failedCount: 0,
    );
  }

  Future<List<DynamicWallpaperAssetRef>> _assetRefsFor(
    List<String> assetIds, {
    bool resolveAssets = true,
    Map<String, config_model.DynamicWallpaperAssetLayout>? layouts,
  }) async {
    final assetLayouts = layouts ?? _settingsRepository.appConfig.dynamicWallpaper.assetLayouts;
    final assetService = this.assetService;
    if (!resolveAssets || assetService == null || assetIds.isEmpty) {
      return assetIds.map((assetId) {
        return DynamicWallpaperAssetRef(
          remoteId: assetId,
          isEdited: false,
          layout: _apiLayoutFrom(assetLayouts[assetId]),
        );
      }).toList();
    }

    final assets = await assetService.getRemoteAssets(assetIds);
    final assetById = {for (final asset in assets) asset.id: asset};

    return assetIds.map((assetId) {
      final asset = assetById[assetId];
      return DynamicWallpaperAssetRef(
        remoteId: assetId,
        localId: asset?.localId,
        isEdited: asset?.isEdited ?? false,
        layout: _apiLayoutFrom(assetLayouts[assetId]),
      );
    }).toList();
  }

  DynamicWallpaperAssetLayout? _apiLayoutFrom(config_model.DynamicWallpaperAssetLayout? layout) {
    final normalized = layout?.normalized();
    if (normalized == null || normalized.isIdentity) {
      return null;
    }

    return DynamicWallpaperAssetLayout(
      rotationDegrees: normalized.rotationDegrees,
      cropLeft: normalized.cropLeft,
      cropTop: normalized.cropTop,
      cropRight: normalized.cropRight,
      cropBottom: normalized.cropBottom,
    );
  }
}
