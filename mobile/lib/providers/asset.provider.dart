import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/user.service.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/providers/infrastructure/user.provider.dart';
import 'package:immich_mobile/providers/memory.provider.dart';
import 'package:immich_mobile/services/album.service.dart';
import 'package:immich_mobile/services/asset.service.dart';
import 'package:immich_mobile/services/etag.service.dart';
import 'package:immich_mobile/services/exif.service.dart';
import 'package:immich_mobile/services/sync.service.dart';
import 'package:logging/logging.dart';

final assetProvider = StateNotifierProvider<AssetNotifier, bool>((ref) {
  return AssetNotifier(
    ref.watch(assetServiceProvider),
    ref.watch(albumServiceProvider),
    ref.watch(userServiceProvider),
    ref.watch(syncServiceProvider),
    ref.watch(etagServiceProvider),
    ref.watch(exifServiceProvider),
    ref,
  );
});

class AssetNotifier extends StateNotifier<bool> {
  final AssetService _assetService;
  final AlbumService _albumService;
  final UserService _userService;
  final SyncService _syncService;
  final ETagService _etagService;
  final ExifService _exifService;
  final Ref _ref;
  final log = Logger('AssetNotifier');
  bool _getAllAssetInProgress = false;
  bool _deleteInProgress = false;

  AssetNotifier(
    this._assetService,
    this._albumService,
    this._userService,
    this._syncService,
    this._etagService,
    this._exifService,
    this._ref,
  ) : super(false);

  Future<void> getAllAsset({bool clear = false}) async {
    if (_getAllAssetInProgress || _deleteInProgress) {
      // guard against multiple calls to this method while it's still working
      return;
    }
    final stopwatch = Stopwatch()..start();
    try {
      _getAllAssetInProgress = true;
      state = true;
      if (clear) {
        await clearAllAssets();
        log.info("Manual refresh requested, cleared assets and albums from db");
      }
      final users = await _syncService.getUsersFromServer();
      bool changedUsers = false;
      if (users != null) {
        changedUsers = await _syncService.syncUsersFromServer(users);
      }
      final bool newRemote = await _assetService.refreshRemoteAssets();
      final bool newLocal = await _albumService.refreshDeviceAlbums();
      debugPrint(
        "changedUsers: $changedUsers, newRemote: $newRemote, newLocal: $newLocal",
      );
      if (newRemote) {
        _ref.invalidate(memoryFutureProvider);
      }

      log.info("Load assets: ${stopwatch.elapsedMilliseconds}ms");
    } finally {
      _getAllAssetInProgress = false;
      state = false;
    }
  }

  Future<void> clearAllAssets() async {
    await Store.delete(StoreKey.assetETag);
    await Future.wait([
      _assetService.clearTable(),
      _exifService.clearTable(),
      _albumService.clearTable(),
      _userService.deleteAll(),
      _etagService.clearTable(),
    ]);
  }

  Future<void> onNewAssetUploaded(Asset newAsset) async {
    // eTag on device is not valid after partially modifying the assets
    Store.delete(StoreKey.assetETag);
    await _syncService.syncNewAssetToDb(newAsset);
  }

  Future<bool> deleteLocalAssets(List<Asset> assets) async {
    _deleteInProgress = true;
    state = true;
    try {
      await _assetService.deleteLocalAssets(assets);
      return true;
    } catch (error) {
      log.severe("Failed to delete local assets", error);
      return false;
    } finally {
      _deleteInProgress = false;
      state = false;
    }
  }

  /// Delete remote asset only
  ///
  /// Default behavior is trashing the asset
  Future<bool> deleteRemoteAssets(
    Iterable<Asset> deleteAssets, {
    bool shouldDeletePermanently = false,
  }) async {
    _deleteInProgress = true;
    state = true;
    try {
      await _assetService.deleteRemoteAssets(
        deleteAssets,
        shouldDeletePermanently: shouldDeletePermanently,
      );
      return true;
    } catch (error) {
      log.severe("Failed to delete remote assets", error);
      return false;
    } finally {
      _deleteInProgress = false;
      state = false;
    }
  }

  Future<bool> deleteAssets(
    Iterable<Asset> deleteAssets, {
    bool force = false,
  }) async {
    _deleteInProgress = true;
    state = true;
    try {
      await _assetService.deleteAssets(
        deleteAssets,
        shouldDeletePermanently: force,
      );
      return true;
    } catch (error) {
      log.severe("Failed to delete assets", error);
      return false;
    } finally {
      _deleteInProgress = false;
      state = false;
    }
  }

  Future<void> toggleFavorite(List<Asset> assets, [bool? status]) {
    status ??= !assets.every((a) => a.isFavorite);
    return _assetService.changeFavoriteStatus(assets, status);
  }

  Future<void> toggleArchive(List<Asset> assets, [bool? status]) {
    status ??= !assets.every((a) => a.isArchived);
    return _assetService.changeArchiveStatus(assets, status);
  }
}

final assetDetailProvider =
    StreamProvider.autoDispose.family<Asset, Asset>((ref, asset) async* {
  final assetService = ref.watch(assetServiceProvider);
  yield await assetService.loadExif(asset);

  await for (final asset in assetService.watchAsset(asset.id)) {
    if (asset != null) {
      yield await ref.watch(assetServiceProvider).loadExif(asset);
    }
  }
});

final assetWatcher =
    StreamProvider.autoDispose.family<Asset?, Asset>((ref, asset) {
  final assetService = ref.watch(assetServiceProvider);
  return assetService.watchAsset(asset.id, fireImmediately: true);
});
