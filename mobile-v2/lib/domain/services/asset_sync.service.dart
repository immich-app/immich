import 'dart:async';

import 'package:collection/collection.dart';
import 'package:immich_mobile/domain/interfaces/api/sync_api.interface.dart';
import 'package:immich_mobile/domain/interfaces/asset.interface.dart';
import 'package:immich_mobile/domain/interfaces/database.interface.dart';
import 'package:immich_mobile/domain/models/asset.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/service_locator.dart';
import 'package:immich_mobile/utils/collection_util.dart';
import 'package:immich_mobile/utils/constants/globals.dart';
import 'package:immich_mobile/utils/isolate_helper.dart';
import 'package:immich_mobile/utils/mixins/log.mixin.dart';

class AssetSyncService with LogMixin {
  const AssetSyncService();

  Future<bool> performFullRemoteSyncIsolate(
    User user, {
    DateTime? updatedUtil,
    int? limit,
  }) async {
    return await IsolateHelper.run(() async {
      return await performFullRemoteSync(
        user,
        updatedUtil: updatedUtil,
        limit: limit,
      );
    });
  }

  Future<bool> performFullRemoteSync(
    User user, {
    DateTime? updatedUtil,
    int? limit,
  }) async {
    try {
      final Stopwatch stopwatch = Stopwatch()..start();
      final db = di<IDatabaseRepository>();
      final assetRepo = di<IAssetRepository>();
      final syncApiRepo = di<ISyncApiRepository>();

      final chunkSize = limit ?? kFullSyncChunkSize;
      final updatedTill = updatedUtil ?? DateTime.now().toUtc();
      updatedUtil ??= DateTime.now().toUtc();
      String? lastAssetId;

      while (true) {
        log.d(
          "Requesting more chunks from lastId - ${lastAssetId ?? "<initial_fetch>"}",
        );

        final assetsFromServer = await syncApiRepo.getFullSyncForUser(
          limit: chunkSize,
          updatedUntil: updatedTill,
          lastId: lastAssetId,
          userId: user.id,
        );
        if (assetsFromServer == null) {
          break;
        }

        await db.txn(() async {
          final assetsInDb =
              await assetRepo.getForHashes(assetsFromServer.map((a) => a.hash));

          await upsertAssetsToDb(
            assetsFromServer,
            assetsInDb,
            isRemoteSync: true,
          );
        });

        lastAssetId = assetsFromServer.lastOrNull?.remoteId;
        if (assetsFromServer.length != chunkSize) break;
      }

      log.i("Full remote sync took - ${stopwatch.elapsedMilliseconds}ms");
      return true;
    } catch (e, s) {
      log.e("Error performing full remote sync for user - ${user.name}", e, s);
    }
    return false;
  }

  Future<void> upsertAssetsToDb(
    List<Asset> newAssets,
    List<Asset> existingAssets, {
    bool? isRemoteSync,
    Comparator<Asset> compare = Asset.compareByHash,
  }) async {
    final (toAdd, toUpdate, toRemove) = await _diffAssets(
      newAssets,
      existingAssets,
      compare: compare,
      isRemoteSync: isRemoteSync,
    );

    final assetsToAdd = toAdd.followedBy(toUpdate);

    await di<IAssetRepository>().upsertAll(assetsToAdd);
    await di<IAssetRepository>().deleteIds(toRemove.map((a) => a.id!).toList());
  }

  /// Returns a triple (toAdd, toUpdate, toRemove)
  FutureOr<(List<Asset>, List<Asset>, List<Asset>)> _diffAssets(
    List<Asset> newAssets,
    List<Asset> inDb, {
    bool? isRemoteSync,
    Comparator<Asset> compare = Asset.compareByHash,
  }) async {
    // fast paths for trivial cases: reduces memory usage during initial sync etc.
    if (newAssets.isEmpty && inDb.isEmpty) {
      return const (<Asset>[], <Asset>[], <Asset>[]);
    } else if (newAssets.isEmpty && isRemoteSync == null) {
      // remove all from database
      return (const <Asset>[], const <Asset>[], inDb);
    } else if (inDb.isEmpty) {
      // add all assets
      return (newAssets, const <Asset>[], const <Asset>[]);
    }

    final List<Asset> toAdd = [];
    final List<Asset> toUpdate = [];
    final List<Asset> toRemove = [];
    await CollectionUtil.diffLists(
      inDb,
      newAssets,
      compare: compare,
      both: (Asset a, Asset b) {
        if (a != b) {
          toUpdate.add(a.merge(b));
          return true;
        }
        return false;
      },
      // Only in DB (removed asset)
      onlyFirst: (Asset a) {
        // We are syncing remote assets, if asset only inDB, then it is removed from remote
        if (isRemoteSync == true && a.isLocal) {
          if (a.remoteId != null) {
            toUpdate.add(a.copyWith(remoteId: () => null));
          }
          // We are syncing local assets, mark the asset inDB as local only
        } else if (isRemoteSync == false && a.isRemote) {
          if (a.isLocal) {
            toUpdate.add(a.copyWith(localId: () => null));
          }
        } else {
          toRemove.add(a);
        }
      },
      // Only in new assets
      onlySecond: (Asset b) => toAdd.add(b),
    );
    return (toAdd, toUpdate, toRemove);
  }
}
