// ignore_for_file: deprecated_member_use_from_same_package

import 'package:flutter/cupertino.dart';
import 'package:hive/hive.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/modules/album/services/album_cache.service.dart';
import 'package:immich_mobile/modules/backup/models/backup_album.model.dart';
import 'package:immich_mobile/modules/backup/models/duplicated_asset.model.dart';
import 'package:immich_mobile/modules/backup/models/hive_backup_albums.model.dart';
import 'package:immich_mobile/modules/backup/models/hive_duplicated_assets.model.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/shared/services/asset_cache.service.dart';
import 'package:isar/isar.dart';

Future<void> migrateHiveToStoreIfNecessary() async {
  await _migrateHiveBoxIfNecessary(userInfoBox, _migrateHiveUserInfoBox);
  await _migrateHiveBoxIfNecessary(
    backgroundBackupInfoBox,
    _migrateHiveBackgroundBackupInfoBox,
  );
  await _migrateHiveBoxIfNecessary(hiveBackupInfoBox, _migrateBackupInfoBox);
  await _migrateHiveBoxIfNecessary(
    duplicatedAssetsBox,
    _migrateDuplicatedAssetsBox,
  );
}

Future<void> _migrateHiveUserInfoBox(Box box) async {
  await _migrateKey(box, userIdKey, StoreKey.userRemoteId);
  await _migrateKey(box, assetEtagKey, StoreKey.assetETag);
}

Future<void> _migrateHiveBackgroundBackupInfoBox(Box box) async {
  await _migrateKey(box, backupFailedSince, StoreKey.backupFailedSince);
  await _migrateKey(box, backupRequireWifi, StoreKey.backupRequireWifi);
  await _migrateKey(box, backupRequireCharging, StoreKey.backupRequireCharging);
  await _migrateKey(box, backupTriggerDelay, StoreKey.backupTriggerDelay);
  return box.deleteFromDisk();
}

Future<void> _migrateBackupInfoBox(Box<HiveBackupAlbums> box) async {
  final Isar? db = Isar.getInstance();
  if (db == null) {
    throw Exception("_migrateBackupInfoBox could not load database");
  }
  final HiveBackupAlbums? infos = box.get(backupInfoKey);
  if (infos != null) {
    List<BackupAlbum> albums = [];
    for (int i = 0; i < infos.selectedAlbumIds.length; i++) {
      final album = BackupAlbum(
        infos.selectedAlbumIds[i],
        infos.lastSelectedBackupTime[i],
        BackupSelection.select,
      );
      albums.add(album);
    }
    for (int i = 0; i < infos.excludedAlbumsIds.length; i++) {
      final album = BackupAlbum(
        infos.excludedAlbumsIds[i],
        infos.lastExcludedBackupTime[i],
        BackupSelection.exclude,
      );
      albums.add(album);
    }
    await db.writeTxn(() => db.backupAlbums.putAll(albums));
  } else {
    debugPrint("_migrateBackupInfoBox deletes empty box");
  }
  return box.deleteFromDisk();
}

Future<void> _migrateDuplicatedAssetsBox(Box<HiveDuplicatedAssets> box) async {
  final Isar? db = Isar.getInstance();
  if (db == null) {
    throw Exception("_migrateBackupInfoBox could not load database");
  }
  final HiveDuplicatedAssets? duplicatedAssets = box.get(duplicatedAssetsKey);
  if (duplicatedAssets != null) {
    final duplicatedAssetIds = duplicatedAssets.duplicatedAssetIds
        .map((id) => DuplicatedAsset(id))
        .toList();
    await db.writeTxn(() => db.duplicatedAssets.putAll(duplicatedAssetIds));
  } else {
    debugPrint("_migrateDuplicatedAssetsBox deletes empty box");
  }
  return box.deleteFromDisk();
}

Future<void> _migrateHiveBoxIfNecessary<T>(
  String boxName,
  Future<void> Function(Box<T>) migrate,
) async {
  try {
    if (await Hive.boxExists(boxName)) {
      await migrate(await Hive.openBox<T>(boxName));
    }
  } catch (e) {
    debugPrint("Error while migrating $boxName $e");
  }
}

_migrateKey(Box box, String hiveKey, StoreKey key) async {
  final String? value = box.get(hiveKey);
  if (value != null) {
    await Store.put(key, value);
    await box.delete(hiveKey);
  }
}

Future<void> migrateJsonCacheIfNecessary() async {
  await AlbumCacheService().invalidate();
  await SharedAlbumCacheService().invalidate();
  await AssetCacheService().invalidate();
}
