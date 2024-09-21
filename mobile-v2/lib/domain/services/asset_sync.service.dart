import 'dart:async';

import 'package:collection/collection.dart';
import 'package:immich_mobile/domain/interfaces/asset.interface.dart';
import 'package:immich_mobile/domain/models/asset.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/service_locator.dart';
import 'package:immich_mobile/utils/collection_util.dart';
import 'package:immich_mobile/utils/constants/globals.dart';
import 'package:immich_mobile/utils/immich_api_client.dart';
import 'package:immich_mobile/utils/isolate_helper.dart';
import 'package:immich_mobile/utils/log_manager.dart';
import 'package:immich_mobile/utils/mixins/log.mixin.dart';
import 'package:openapi/api.dart';

class AssetSyncService with LogMixin {
  const AssetSyncService();

  Future<bool> performFullRemoteSyncForUser(
    User user, {
    DateTime? updatedUtil,
    int? limit,
  }) async {
    return await IsolateHelper.run(() async {
      try {
        final logger = LogManager.I.get("SyncService <Isolate>");
        final syncClient = di<ImmichApiClient>().getSyncApi();

        final chunkSize = limit ?? kFullSyncChunkSize;
        final updatedTill = updatedUtil ?? DateTime.now().toUtc();
        updatedUtil ??= DateTime.now().toUtc();
        String? lastAssetId;

        while (true) {
          logger.d(
            "Requesting more chunks from lastId - ${lastAssetId ?? "<initial_fetch>"}",
          );

          final assets = await syncClient.getFullSyncForUser(AssetFullSyncDto(
            limit: chunkSize,
            updatedUntil: updatedTill,
            lastId: lastAssetId,
            userId: user.id,
          ));
          if (assets == null) {
            break;
          }

          final assetsFromServer =
              assets.map(Asset.remote).sorted(Asset.compareByRemoteId);

          final assetsInDb = await di<IAssetRepository>().getForRemoteIds(
            assetsFromServer.map((a) => a.remoteId!).toList(),
          );

          await _syncAssetsToDb(
            assetsFromServer,
            assetsInDb,
            Asset.compareByRemoteId,
            isRemoteSync: true,
          );

          lastAssetId = assets.lastOrNull?.id;
          if (assets.length != chunkSize) break;
        }

        return true;
      } catch (e, s) {
        log.e("Error performing full sync for user - ${user.name}", e, s);
      }
      return false;
    });
  }

  Future<void> _syncAssetsToDb(
    List<Asset> newAssets,
    List<Asset> existingAssets,
    Comparator<Asset> compare, {
    bool? isRemoteSync,
  }) async {
    final (toAdd, toUpdate, assetsToRemove) = _diffAssets(
      newAssets,
      existingAssets,
      compare: compare,
      isRemoteSync: isRemoteSync,
    );

    final assetsToAdd = toAdd.followedBy(toUpdate);

    await di<IAssetRepository>().upsertAll(assetsToAdd);
    await di<IAssetRepository>()
        .deleteIds(assetsToRemove.map((a) => a.id).toList());
  }

  /// Returns a triple (toAdd, toUpdate, toRemove)
  (List<Asset>, List<Asset>, List<Asset>) _diffAssets(
    List<Asset> newAssets,
    List<Asset> inDb, {
    bool? isRemoteSync,
    required Comparator<Asset> compare,
  }) {
    // fast paths for trivial cases: reduces memory usage during initial sync etc.
    if (newAssets.isEmpty && inDb.isEmpty) {
      return const ([], [], []);
    } else if (newAssets.isEmpty && isRemoteSync == null) {
      // remove all from database
      return (const [], const [], inDb);
    } else if (inDb.isEmpty) {
      // add all assets
      return (newAssets, const [], const []);
    }

    final List<Asset> toAdd = [];
    final List<Asset> toUpdate = [];
    final List<Asset> toRemove = [];
    CollectionUtil.diffSortedLists(
      inDb,
      newAssets,
      compare: compare,
      both: (Asset a, Asset b) {
        if (a == b) {
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
      // Only in remote (new asset)
      onlySecond: (Asset b) => toAdd.add(b),
    );
    return (toAdd, toUpdate, toRemove);
  }
}
