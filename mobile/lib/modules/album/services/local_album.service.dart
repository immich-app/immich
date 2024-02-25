import 'dart:async';
import 'dart:io';
import 'package:collection/collection.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/collection_extensions.dart';
import 'package:immich_mobile/modules/album/models/album.model.dart';
import 'package:immich_mobile/extensions/album_extensions.dart';
import 'package:immich_mobile/modules/backup/models/backup_album.model.dart';
import 'package:immich_mobile/modules/backup/providers/backup_album.provider.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/etag.dart';
import 'package:immich_mobile/shared/models/exif_info.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/shared/services/hash.service.dart';
import 'package:immich_mobile/shared/services/sync.service.dart';
import 'package:immich_mobile/utils/diff.dart';
import 'package:isar/isar.dart';
import 'package:logging/logging.dart';
import 'package:photo_manager/photo_manager.dart';

class LocalAlbumService {
  Completer<bool> _localCompleter = Completer()..complete(false);
  final Logger _log = Logger('LocalAlbumService');

  final Isar _db;
  final Ref _ref;
  final HashService _hashService;
  final SyncService _syncService;

  LocalAlbumService(this._db, this._hashService, this._syncService, this._ref);

  Future<bool> refreshDeviceAlbums() async =>
      SyncService.lock.run(_refreshDeviceAlbums);

  /// Checks all selected device albums for changes of albums and their assets
  /// Updates the local database and returns `true` if there were any changes
  Future<bool> _refreshDeviceAlbums() async {
    if (!_localCompleter.isCompleted) {
      // guard against concurrent calls
      _log.info("refreshDeviceAlbums is already in progress");
      return _localCompleter.future;
    }

    _localCompleter = Completer();
    final Stopwatch sw = Stopwatch()..start();
    bool changes = false;
    try {
      final List<AssetPathEntity> onDevice =
          await PhotoManager.getAssetPathList(
        filterOption: FilterOptionGroup(containsPathModified: true),
      );
      _log.fine("Found ${onDevice.length} device albums");
      changes = await _syncLocalAlbumAssetsToDb(onDevice);
      _log.fine("Syncing completed. Changes: $changes");
    } finally {
      _localCompleter.complete(changes);
    }
    _log.fine("refreshDeviceAlbums took ${sw.elapsedMilliseconds}ms");
    return changes;
  }

  /// Syncs all device albums and their assets to the database
  /// Returns `true` if there were any changes
  Future<bool> _syncLocalAlbumAssetsToDb(List<AssetPathEntity> onDevice) async {
    onDevice.sort((a, b) => a.id.compareTo(b.id));
    final inDb = await _db.localAlbums.where().sortById().findAll();
    final List<Asset> deleteCandidates = [];
    final List<Asset> existing = [];
    assert(inDb.isSorted((a, b) => a.id.compareTo(b.id)), "sort!");
    final bool anyChanges = await diffSortedLists(
      onDevice,
      inDb,
      compare: (AssetPathEntity a, LocalAlbum b) => a.id.compareTo(b.id),
      both: (AssetPathEntity ape, LocalAlbum album) =>
          _syncAlbumInDbAndOnDevice(ape, album, deleteCandidates, existing),
      onlyFirst: (AssetPathEntity ape) => _addAlbumFromDevice(ape, existing),
      onlySecond: (LocalAlbum a) => _removeAlbumFromDb(a, deleteCandidates),
    );
    _log.fine(
      "Syncing all local albums almost done. Collected ${deleteCandidates.length} asset candidates to delete",
    );
    final (toDelete, toUpdate) =
        _handleAssetRemoval(deleteCandidates, existing, remote: false);
    _log.fine(
      "${toDelete.length} assets to delete, ${toUpdate.length} to update",
    );

    if (toDelete.isNotEmpty || toUpdate.isNotEmpty) {
      await _db.writeTxn(() async {
        await _db.assets.deleteAll(toDelete);
        await _db.exifInfos.deleteAll(toDelete);
        await _db.assets.putAll(toUpdate);
      });
      _log.info(
        "Removed ${toDelete.length} and updated ${toUpdate.length} local assets from DB",
      );
    }
    return anyChanges;
  }

  /// Accumulates all suitable album assets to the `deleteCandidates` and
  /// removes the album from the database.
  Future<void> _removeAlbumFromDb(
    LocalAlbum album,
    List<Asset> deleteCandidates,
  ) async {
    _log.info("Removing local album $album from DB");
    // delete assets in DB unless they are remote or part of some other album
    deleteCandidates.addAll(
      await album.assets.filter().remoteIdIsNull().findAll(),
    );
    await album.backup.load();
    final backupAlbum = album.backup.value;
    try {
      final ok = await _db.writeTxn(() async {
        return await _db.localAlbums.delete(album.isarId) &&
            (backupAlbum == null ||
                await _db.backupAlbums.delete(album.isarId));
      });
      assert(ok);
      _log.info("Removed local album $album from DB");
    } catch (e, stack) {
      _log.severe("Failed to remove local album $album from DB: $e", stack);
    }
  }

  /// returns a tuple (toDelete toUpdate) when assets are to be deleted
  (List<int> toDelete, List<Asset> toUpdate) _handleAssetRemoval(
    List<Asset> deleteCandidates,
    List<Asset> existing, {
    bool? remote,
  }) {
    if (deleteCandidates.isEmpty) {
      return const ([], []);
    }
    deleteCandidates.sort(Asset.compareById);
    deleteCandidates.uniqueConsecutive(compare: Asset.compareById);
    existing.sort(Asset.compareById);
    existing.uniqueConsecutive(compare: Asset.compareById);
    final (tooAdd, toUpdate, toRemove) = _syncService.diffAssets(
      existing,
      deleteCandidates,
      compare: Asset.compareById,
      remote: remote,
    );
    assert(tooAdd.isEmpty, "toAdd should be empty in _handleAssetRemoval");
    return (toRemove.map((e) => e.id).toList(), toUpdate);
  }

  /// Syncs the device album to the album in the database
  /// returns `true` if there were any changes
  /// Accumulates asset candidates to delete and those already existing in DB
  Future<bool> _syncAlbumInDbAndOnDevice(
    AssetPathEntity ape,
    LocalAlbum album,
    List<Asset> deleteCandidates,
    List<Asset> existing, [
    bool forceRefresh = false,
  ]) async {
    if (!forceRefresh && !await _hasAssetPathEntityChanged(ape, album)) {
      _log.fine("Local album ${ape.name} has not changed. Skipping sync.");
      return false;
    }
    if (!forceRefresh && await _syncDeviceAlbumFast(ape, album)) {
      return true;
    }

    // general case, e.g. some assets have been deleted or there are excluded albums on iOS
    final inDb = await album.assets
        .filter()
        .ownerIdEqualTo(Store.get(StoreKey.currentUser).isarId)
        .sortByChecksum()
        .findAll();
    assert(inDb.isSorted(Asset.compareByChecksum), "inDb not sorted!");
    final List<Asset> onDevice = await _hashService.getHashedAssets(ape);
    // _removeDuplicates sorts `onDevice` by checksum
    _removeDuplicates(onDevice);
    final (toAdd, toUpdate, toDelete) = _syncService.diffAssets(onDevice, inDb);
    _log.fine(
      "Syncing local album ${ape.name}. ${toAdd.length} assets to add, ${toUpdate.length} to update, ${toDelete.length} to delete",
    );
    final (existingInDb, updated) = await _linkWithExistingFromDb(toAdd);
    _log.fine(
      "Linking assets to add with existing from db. ${existingInDb.length} existing, ${updated.length} to update",
    );
    deleteCandidates.addAll(toDelete);
    existing.addAll(existingInDb);
    album.name = ape.name;
    album.modifiedAt = ape.lastModified ?? DateTime.now();
    if (album.thumb.value != null && toDelete.contains(album.thumbnail)) {
      album.thumb.value = null;
    }
    try {
      await _db.writeTxn(() async {
        await _db.assets.putAll(updated);
        await _db.assets.putAll(toUpdate);
        await album.assets
            .update(link: existingInDb + updated, unlink: toDelete);
        album.thumb.value ??= await album.assets.filter().findFirst();
        await _db.localAlbums.store(album);
      });
      _updateETagCount(ape);
      _log.info("Synced changes of local album ${ape.name} to DB");
    } on IsarError catch (e, stack) {
      _log.severe("Failed to update synced album ${ape.name} in DB: $e", stack);
    }

    return true;
  }

  /// returns `true` if the albums differ on the surface
  Future<bool> _hasAssetPathEntityChanged(
    AssetPathEntity a,
    LocalAlbum b,
  ) async {
    final lastKnownTotal =
        (await _db.eTags.getById(a.eTagKeyAssetCount))?.assetCount ?? 0;
    final hasSameLastModified = !(Platform.isAndroid && a.isAll) &&
        (a.lastModified == null ||
            !a.lastModified!.isAtSameMomentAs(b.modifiedAt));
    return a.name != b.name ||
        hasSameLastModified ||
        await a.assetCountAsync != lastKnownTotal;
  }

  /// Adds a new album from the device to the database and Accumulates all
  /// assets already existing in the database to the list of `existing` assets
  Future<void> _addAlbumFromDevice(
    AssetPathEntity ape,
    List<Asset> existing,
  ) async {
    _log.info("Syncing a new local album to DB: ${ape.name}");

    final assets = await _hashService.getHashedAssets(ape);
    _removeDuplicates(assets);
    final (existingInDb, updated) = await _linkWithExistingFromDb(assets);
    _log.info(
      "${existingInDb.length} assets already existed in DB, to upsert ${updated.length}",
    );
    await _syncService.upsertAssetsWithExif(updated);
    existing.addAll(existingInDb);
    final thumb = existingInDb.firstOrNull ?? updated.firstOrNull;
    final LocalAlbum a = LocalAlbum.fromAssetPathEntity(
      ape,
      thumbnail: thumb,
      assets: existingInDb.followedBy(updated),
    );
    try {
      await _db.writeTxn(() => _db.localAlbums.store(a));
      _updateETagCount(ape);
      _log.info("Added a new local album to DB: ${ape.name}");
    } on IsarError catch (e, stack) {
      _log.severe("Failed to add new local album ${ape.name} to DB: $e", stack);
    }
    await _ref.read(backupAlbumsProvider.notifier).syncWithLocalAlbum(a);
  }

  /// fast path for common case: only new assets were added to device album
  /// returns `true` if successfull, else `false`
  Future<bool> _syncDeviceAlbumFast(
    AssetPathEntity ape,
    LocalAlbum album,
  ) async {
    if (!(ape.lastModified ?? DateTime.now()).isAfter(album.modifiedAt)) {
      return false;
    }
    final int totalOnDevice = await ape.assetCountAsync;
    final int lastKnownTotal =
        (await _db.eTags.getById(ape.eTagKeyAssetCount))?.assetCount ?? 0;
    final AssetPathEntity? modified = totalOnDevice > lastKnownTotal
        ? await ape.fetchPathProperties(
            filterOptionGroup: FilterOptionGroup(
              updateTimeCond: DateTimeCond(
                min: album.modifiedAt.add(const Duration(seconds: 1)),
                max: ape.lastModified ?? DateTime.now(),
              ),
            ),
          )
        : null;
    if (modified == null) {
      return false;
    }
    final List<Asset> newAssets = await _hashService.getHashedAssets(modified);

    if (totalOnDevice != lastKnownTotal + newAssets.length) {
      return false;
    }
    album.modifiedAt = ape.lastModified ?? DateTime.now();
    _removeDuplicates(newAssets);
    final (existingInDb, updated) = await _linkWithExistingFromDb(newAssets);
    try {
      await _db.writeTxn(() async {
        await _db.assets.putAll(updated);
        await album.assets.update(link: existingInDb + updated);
        await _db.localAlbums.put(album);
      });
      _updateETagCount(ape);
      _log.info("Fast synced local album ${ape.name} to DB");
    } on IsarError catch (e, stack) {
      _log.severe(
        "Failed to fast sync local album ${ape.name} to DB: $e",
        stack,
      );
      return false;
    }

    return true;
  }

  Future<void> _updateETagCount(AssetPathEntity ape) async {
    final assetCountOnDevice = await ape.assetCountAsync;
    return _db.writeTxn(
      () => _db.eTags.put(
        ETag(id: ape.eTagKeyAssetCount, assetCount: assetCountOnDevice),
      ),
    );
  }

  List<Asset> _removeDuplicates(List<Asset> assets) {
    final int before = assets.length;
    assets.sort(Asset.compareByOwnerChecksumCreatedModified);
    assets.uniqueConsecutive(
      compare: Asset.compareByOwnerChecksum,
      onDuplicate: (a, b) =>
          _log.fine("Ignoring duplicate assets on device:\n$a\n$b"),
    );
    final int duplicates = before - assets.length;
    if (duplicates > 0) {
      _log.warning("Ignored $duplicates duplicate assets on device");
    }
    return assets;
  }

  /// Returns a tuple (existing, updated)
  Future<(List<Asset> existing, List<Asset> updated)> _linkWithExistingFromDb(
    List<Asset> assets,
  ) async {
    if (assets.isEmpty) return ([].cast<Asset>(), [].cast<Asset>());

    final List<Asset?> inDb = await _db.assets.getAllByOwnerIdChecksum(
      assets.map((a) => a.ownerId).toInt64List(),
      assets.map((a) => a.checksum).toList(growable: false),
    );
    assert(inDb.length == assets.length);
    final List<Asset> existing = [], toUpsert = [];
    for (int i = 0; i < assets.length; i++) {
      final Asset? b = inDb[i];
      if (b == null) {
        toUpsert.add(assets[i]);
        continue;
      }
      if (b.canUpdate(assets[i])) {
        final updated = b.updatedCopy(assets[i]);
        assert(updated.id != Isar.autoIncrement);
        toUpsert.add(updated);
      } else {
        existing.add(b);
      }
    }
    assert(existing.length + toUpsert.length == assets.length);
    return (existing, toUpsert);
  }
}
