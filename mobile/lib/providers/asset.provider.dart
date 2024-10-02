import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/memory.provider.dart';
import 'package:immich_mobile/repositories/asset_media.repository.dart';
import 'package:immich_mobile/services/album.service.dart';
import 'package:immich_mobile/entities/exif_info.entity.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/services/asset.service.dart';
import 'package:immich_mobile/widgets/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/services/sync.service.dart';
import 'package:immich_mobile/services/user.service.dart';
import 'package:immich_mobile/utils/db.dart';
import 'package:immich_mobile/utils/renderlist_generator.dart';
import 'package:isar/isar.dart';
import 'package:logging/logging.dart';

class AssetNotifier extends StateNotifier<bool> {
  final AssetService _assetService;
  final AlbumService _albumService;
  final UserService _userService;
  final SyncService _syncService;
  final Isar _db;
  final StateNotifierProviderRef _ref;
  final log = Logger('AssetNotifier');
  bool _getAllAssetInProgress = false;
  bool _deleteInProgress = false;

  AssetNotifier(
    this._assetService,
    this._albumService,
    this._userService,
    this._syncService,
    this._db,
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
        await clearAssetsAndAlbums(_db);
        log.info("Manual refresh requested, cleared assets and albums from db");
      }
      final bool changedUsers = await _userService.refreshUsers();
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

  Future<void> clearAllAsset() {
    return clearAssetsAndAlbums(_db);
  }

  Future<void> onNewAssetUploaded(Asset newAsset) async {
    // eTag on device is not valid after partially modifying the assets
    Store.delete(StoreKey.assetETag);
    await _syncService.syncNewAssetToDb(newAsset);
  }

  Future<bool> deleteLocalOnlyAssets(
    Iterable<Asset> deleteAssets, {
    bool onlyBackedUp = false,
  }) async {
    _deleteInProgress = true;
    state = true;
    try {
      final assets = onlyBackedUp
          ? deleteAssets.where((e) => e.storage == AssetState.merged)
          : deleteAssets;
      final localDeleted = await _deleteLocalAssets(assets);
      if (localDeleted.isNotEmpty) {
        final localOnlyIds = deleteAssets
            .where((e) => e.storage == AssetState.local)
            .map((e) => e.id)
            .toList();
        // Update merged assets to remote only
        final mergedAssets =
            deleteAssets.where((e) => e.storage == AssetState.merged).map((e) {
          e.localId = null;
          return e;
        }).toList();
        await _db.writeTxn(() async {
          if (mergedAssets.isNotEmpty) {
            await _db.assets.putAll(mergedAssets);
          }
          await _db.exifInfos.deleteAll(localOnlyIds);
          await _db.assets.deleteAll(localOnlyIds);
        });
        return true;
      }
    } finally {
      _deleteInProgress = false;
      state = false;
    }
    return false;
  }

  Future<bool> deleteRemoteOnlyAssets(
    Iterable<Asset> deleteAssets, {
    bool force = false,
  }) async {
    _deleteInProgress = true;
    state = true;
    try {
      final remoteDeleted = await _deleteRemoteAssets(deleteAssets, force);
      if (remoteDeleted.isNotEmpty) {
        final assetsToUpdate = force

            /// If force, only update merged only assets and remove remote assets
            ? remoteDeleted
                .where((e) => e.storage == AssetState.merged)
                .map((e) {
                e.remoteId = null;
                return e;
              })
            // If not force, trash everything
            : remoteDeleted.where((e) => e.isRemote).map((e) {
                e.isTrashed = true;
                return e;
              });

        await _db.writeTxn(() async {
          if (assetsToUpdate.isNotEmpty) {
            await _db.assets.putAll(assetsToUpdate.toList());
          }
          if (force) {
            final remoteOnly = remoteDeleted
                .where((e) => e.storage == AssetState.remote)
                .map((e) => e.id)
                .toList();
            await _db.exifInfos.deleteAll(remoteOnly);
            await _db.assets.deleteAll(remoteOnly);
          }
        });
        return true;
      }
    } finally {
      _deleteInProgress = false;
      state = false;
    }
    return false;
  }

  Future<bool> deleteAssets(
    Iterable<Asset> deleteAssets, {
    bool force = false,
  }) async {
    _deleteInProgress = true;
    state = true;
    try {
      final hasLocal = deleteAssets.any((a) => a.storage != AssetState.remote);
      final localDeleted = await _deleteLocalAssets(deleteAssets);
      final remoteDeleted = (hasLocal && localDeleted.isNotEmpty) || !hasLocal
          ? await _deleteRemoteAssets(deleteAssets, force)
          : [];
      if (localDeleted.isNotEmpty || remoteDeleted.isNotEmpty) {
        final dbIds = <int>[];
        final dbUpdates = <Asset>[];

        // Local assets are removed
        if (localDeleted.isNotEmpty) {
          // Permanently remove local only assets from isar
          dbIds.addAll(
            deleteAssets
                .where((a) => a.storage == AssetState.local)
                .map((e) => e.id),
          );

          if (remoteDeleted.any((e) => e.isLocal)) {
            // Force delete: Add all local assets including merged assets
            if (force) {
              dbIds.addAll(remoteDeleted.map((e) => e.id));
              // Soft delete: Remove local Id from asset and trash it
            } else {
              dbUpdates.addAll(
                remoteDeleted.map((e) {
                  e.localId = null;
                  e.isTrashed = true;
                  return e;
                }),
              );
            }
          }
        }

        // Handle remote deletion
        if (remoteDeleted.isNotEmpty) {
          if (force) {
            // Remove remote only assets
            dbIds.addAll(
              deleteAssets
                  .where((a) => a.storage == AssetState.remote)
                  .map((e) => e.id),
            );
            // Local assets are not removed and there are merged assets
            final hasLocal = remoteDeleted.any((e) => e.isLocal);
            if (localDeleted.isEmpty && hasLocal) {
              // Remove remote Id from local assets
              dbUpdates.addAll(
                remoteDeleted.map((e) {
                  e.remoteId = null;
                  // Remove from trashed if remote asset is removed
                  e.isTrashed = false;
                  return e;
                }),
              );
            }
          } else {
            dbUpdates.addAll(
              remoteDeleted.map((e) {
                e.isTrashed = true;
                return e;
              }),
            );
          }
        }

        await _db.writeTxn(() async {
          await _db.assets.putAll(dbUpdates);
          await _db.exifInfos.deleteAll(dbIds);
          await _db.assets.deleteAll(dbIds);
        });
        return true;
      }
    } finally {
      _deleteInProgress = false;
      state = false;
    }
    return false;
  }

  Future<List<String>> _deleteLocalAssets(
    Iterable<Asset> assetsToDelete,
  ) async {
    final List<String> local =
        assetsToDelete.where((a) => a.isLocal).map((a) => a.localId!).toList();
    // Delete asset from device
    if (local.isNotEmpty) {
      try {
        return await _ref.read(assetMediaRepositoryProvider).deleteAll(local);
      } catch (e, stack) {
        log.severe("Failed to delete asset from device", e, stack);
      }
    }
    return [];
  }

  Future<List<Asset>> _deleteRemoteAssets(
    Iterable<Asset> assetsToDelete,
    bool? force,
  ) async {
    final Iterable<Asset> remote = assetsToDelete.where((e) => e.isRemote);

    final isSuccess = await _assetService.deleteAssets(remote, force: force);
    return isSuccess ? remote.toList() : [];
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

final assetProvider = StateNotifierProvider<AssetNotifier, bool>((ref) {
  return AssetNotifier(
    ref.watch(assetServiceProvider),
    ref.watch(albumServiceProvider),
    ref.watch(userServiceProvider),
    ref.watch(syncServiceProvider),
    ref.watch(dbProvider),
    ref,
  );
});

final assetDetailProvider =
    StreamProvider.autoDispose.family<Asset, Asset>((ref, asset) async* {
  yield await ref.watch(assetServiceProvider).loadExif(asset);
  final db = ref.watch(dbProvider);
  await for (final a in db.assets.watchObject(asset.id)) {
    if (a != null) {
      yield await ref.watch(assetServiceProvider).loadExif(a);
    }
  }
});

final assetWatcher =
    StreamProvider.autoDispose.family<Asset?, Asset>((ref, asset) {
  final db = ref.watch(dbProvider);
  return db.assets.watchObject(asset.id, fireImmediately: true);
});

final assetsProvider = StreamProvider.family<RenderList, int?>((ref, userId) {
  if (userId == null) return const Stream.empty();
  final query = _commonFilterAndSort(
    _assets(ref).where().ownerIdEqualToAnyChecksum(userId),
  );
  return renderListGenerator(query, ref);
});

final multiUserAssetsProvider =
    StreamProvider.family<RenderList, List<int>>((ref, userIds) {
  if (userIds.isEmpty) return const Stream.empty();
  final query = _commonFilterAndSort(
    _assets(ref)
        .where()
        .anyOf(userIds, (q, u) => q.ownerIdEqualToAnyChecksum(u)),
  );
  return renderListGenerator(query, ref);
});

QueryBuilder<Asset, Asset, QAfterSortBy>? getRemoteAssetQuery(WidgetRef ref) {
  final userId = ref.watch(currentUserProvider)?.isarId;
  if (userId == null) {
    return null;
  }
  return ref
      .watch(dbProvider)
      .assets
      .where()
      .remoteIdIsNotNull()
      .filter()
      .ownerIdEqualTo(userId)
      .isTrashedEqualTo(false)
      .stackPrimaryAssetIdIsNull()
      .sortByFileCreatedAtDesc();
}

IsarCollection<Asset> _assets(StreamProviderRef<RenderList> ref) =>
    ref.watch(dbProvider).assets;

QueryBuilder<Asset, Asset, QAfterSortBy> _commonFilterAndSort(
  QueryBuilder<Asset, Asset, QAfterWhereClause> query,
) {
  return query
      .filter()
      .isArchivedEqualTo(false)
      .isTrashedEqualTo(false)
      .stackPrimaryAssetIdIsNull()
      .sortByFileCreatedAtDesc();
}
