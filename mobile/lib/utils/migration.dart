import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:collection/collection.dart';
import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/android_device_asset.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/backup_album.entity.dart' as isar_backup_album;
import 'package:immich_mobile/entities/etag.entity.dart';
import 'package:immich_mobile/entities/ios_device_asset.entity.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/entities/device_asset.entity.dart';
import 'package:immich_mobile/infrastructure/entities/exif.entity.dart';
import 'package:immich_mobile/infrastructure/entities/local_album.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/entities/store.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/sync_stream.repository.dart';
import 'package:immich_mobile/utils/debug_print.dart';
import 'package:immich_mobile/utils/diff.dart';
import 'package:isar/isar.dart';
// ignore: import_rule_photo_manager
import 'package:photo_manager/photo_manager.dart';

const int targetVersion = 16;

Future<void> migrateDatabaseIfNeeded(Isar db, Drift drift) async {
  final hasVersion = Store.tryGet(StoreKey.version) != null;
  final int version = Store.get(StoreKey.version, targetVersion);
  if (version < 9) {
    await Store.put(StoreKey.version, targetVersion);
    final value = await db.storeValues.get(StoreKey.currentUser.id);
    if (value != null) {
      final id = value.intValue;
      if (id != null) {
        await db.writeTxn(() async {
          final user = await db.users.get(id);
          await db.storeValues.put(StoreValue(StoreKey.currentUser.id, strValue: user?.id));
        });
      }
    }
  }

  if (version < 10) {
    await Store.put(StoreKey.version, targetVersion);
    await _migrateDeviceAsset(db);
  }

  if (version < 13) {
    await Store.put(StoreKey.photoManagerCustomFilter, true);
  }

  // This means that the SQLite DB is just created and has no version
  if (version < 14 || !hasVersion) {
    await migrateStoreToSqlite(db, drift);
    await Store.populateCache();
  }

  await handleBetaMigration(version, await _isNewInstallation(db, drift), SyncStreamRepository(drift));

  if (targetVersion >= 12) {
    await Store.put(StoreKey.version, targetVersion);
    return;
  }

  final shouldTruncate = version < 8 || version < targetVersion;

  if (shouldTruncate) {
    await _migrateTo(db, targetVersion);
  }
}

Future<void> handleBetaMigration(int version, bool isNewInstallation, SyncStreamRepository syncStreamRepository) async {
  // Handle migration only for this version
  // TODO: remove when old timeline is removed
  final isBeta = Store.tryGet(StoreKey.betaTimeline);
  final needBetaMigration = Store.tryGet(StoreKey.needBetaMigration);
  if (version <= 15 && needBetaMigration == null) {
    // For new installations, no migration needed
    // For existing installations, only migrate if beta timeline is not enabled (null or false)
    if (isNewInstallation || isBeta == true) {
      await Store.put(StoreKey.needBetaMigration, false);
      await Store.put(StoreKey.betaTimeline, true);
    } else {
      await Store.put(StoreKey.needBetaMigration, true);
    }
  }

  if (version > 15) {
    if (isBeta == null || isBeta) {
      await Store.put(StoreKey.needBetaMigration, false);
      await Store.put(StoreKey.betaTimeline, true);
    } else {
      await Store.put(StoreKey.needBetaMigration, false);
    }
  }

  if (version < 16) {
    await syncStreamRepository.reset();
    await Store.put(StoreKey.shouldResetSync, true);
  }
}

Future<bool> _isNewInstallation(Isar db, Drift drift) async {
  try {
    final isarUserCount = await db.users.count();
    if (isarUserCount > 0) {
      return false;
    }

    final isarAssetCount = await db.assets.count();
    if (isarAssetCount > 0) {
      return false;
    }

    final driftStoreCount = await drift.storeEntity.select().get().then((list) => list.length);
    if (driftStoreCount > 0) {
      return false;
    }

    final driftAssetCount = await drift.localAssetEntity.select().get().then((list) => list.length);
    if (driftAssetCount > 0) {
      return false;
    }

    return true;
  } catch (error) {
    dPrint(() => "[MIGRATION] Error checking if new installation: $error");
    return false;
  }
}

Future<void> _migrateTo(Isar db, int version) async {
  await Store.delete(StoreKey.assetETag);
  await db.writeTxn(() async {
    await db.assets.clear();
    await db.exifInfos.clear();
    await db.albums.clear();
    await db.eTags.clear();
    await db.users.clear();
  });
  await Store.put(StoreKey.version, version);
}

Future<void> _migrateDeviceAsset(Isar db) async {
  final ids = Platform.isAndroid
      ? (await db.androidDeviceAssets.where().findAll())
            .map((a) => _DeviceAsset(assetId: a.id.toString(), hash: a.hash))
            .toList()
      : (await db.iOSDeviceAssets.where().findAll()).map((i) => _DeviceAsset(assetId: i.id, hash: i.hash)).toList();

  final PermissionState ps = await PhotoManager.requestPermissionExtend();
  if (!ps.hasAccess) {
    dPrint(() => "[MIGRATION] Photo library permission not granted. Skipping device asset migration.");
    return;
  }

  List<_DeviceAsset> localAssets = [];
  final List<AssetPathEntity> paths = await PhotoManager.getAssetPathList(onlyAll: true);

  if (paths.isEmpty) {
    localAssets = (await db.assets.where().anyOf(ids, (query, id) => query.localIdEqualTo(id.assetId)).findAll())
        .map((a) => _DeviceAsset(assetId: a.localId!, dateTime: a.fileModifiedAt))
        .toList();
  } else {
    final AssetPathEntity albumWithAll = paths.first;
    final int assetCount = await albumWithAll.assetCountAsync;

    final List<AssetEntity> allDeviceAssets = await albumWithAll.getAssetListRange(start: 0, end: assetCount);

    localAssets = allDeviceAssets.map((a) => _DeviceAsset(assetId: a.id, dateTime: a.modifiedDateTime)).toList();
  }

  dPrint(() => "[MIGRATION] Device Asset Ids length - ${ids.length}");
  dPrint(() => "[MIGRATION] Local Asset Ids length - ${localAssets.length}");
  ids.sort((a, b) => a.assetId.compareTo(b.assetId));
  localAssets.sort((a, b) => a.assetId.compareTo(b.assetId));
  final List<DeviceAssetEntity> toAdd = [];
  await diffSortedLists(
    ids,
    localAssets,
    compare: (a, b) => a.assetId.compareTo(b.assetId),
    both: (deviceAsset, asset) {
      toAdd.add(
        DeviceAssetEntity(assetId: deviceAsset.assetId, hash: deviceAsset.hash!, modifiedTime: asset.dateTime!),
      );
      return false;
    },
    onlyFirst: (deviceAsset) {
      dPrint(() => '[MIGRATION] Local asset not found in DeviceAsset: ${deviceAsset.assetId}');
    },
    onlySecond: (asset) {
      dPrint(() => '[MIGRATION] Local asset not found in DeviceAsset: ${asset.assetId}');
    },
  );

  dPrint(() => "[MIGRATION] Total number of device assets migrated - ${toAdd.length}");

  await db.writeTxn(() async {
    await db.deviceAssetEntitys.putAll(toAdd);
  });
}

Future<void> migrateDeviceAssetToSqlite(Isar db, Drift drift) async {
  try {
    final isarDeviceAssets = await db.deviceAssetEntitys.where().findAll();
    await drift.batch((batch) {
      for (final deviceAsset in isarDeviceAssets) {
        batch.update(
          drift.localAssetEntity,
          LocalAssetEntityCompanion(checksum: Value(base64.encode(deviceAsset.hash))),
          where: (t) => t.id.equals(deviceAsset.assetId),
        );
      }
    });
  } catch (error) {
    dPrint(() => "[MIGRATION] Error while migrating device assets to SQLite: $error");
  }
}

Future<void> migrateBackupAlbumsToSqlite(Isar db, Drift drift) async {
  try {
    final isarBackupAlbums = await db.backupAlbums.where().findAll();
    // Recents is a virtual album on Android, and we don't have it with the new sync
    // If recents is selected previously, select all albums during migration except the excluded ones
    if (Platform.isAndroid) {
      final recentAlbum = isarBackupAlbums.firstWhereOrNull((album) => album.id == 'isAll');
      if (recentAlbum != null) {
        await drift.localAlbumEntity.update().write(
          const LocalAlbumEntityCompanion(backupSelection: Value(BackupSelection.selected)),
        );
        final excluded = isarBackupAlbums
            .where((album) => album.selection == isar_backup_album.BackupSelection.exclude)
            .map((album) => album.id)
            .toList();
        await drift.batch((batch) async {
          for (final id in excluded) {
            batch.update(
              drift.localAlbumEntity,
              const LocalAlbumEntityCompanion(backupSelection: Value(BackupSelection.excluded)),
              where: (t) => t.id.equals(id),
            );
          }
        });
        return;
      }
    }

    await drift.batch((batch) {
      for (final album in isarBackupAlbums) {
        batch.update(
          drift.localAlbumEntity,
          LocalAlbumEntityCompanion(
            backupSelection: Value(switch (album.selection) {
              isar_backup_album.BackupSelection.none => BackupSelection.none,
              isar_backup_album.BackupSelection.select => BackupSelection.selected,
              isar_backup_album.BackupSelection.exclude => BackupSelection.excluded,
            }),
          ),
          where: (t) => t.id.equals(album.id),
        );
      }
    });
  } catch (error) {
    dPrint(() => "[MIGRATION] Error while migrating backup albums to SQLite: $error");
  }
}

Future<void> migrateStoreToSqlite(Isar db, Drift drift) async {
  try {
    final isarStoreValues = await db.storeValues.where().findAll();
    await drift.batch((batch) {
      for (final storeValue in isarStoreValues) {
        final companion = StoreEntityCompanion(
          id: Value(storeValue.id),
          stringValue: Value(storeValue.strValue),
          intValue: Value(storeValue.intValue),
        );
        batch.insert(drift.storeEntity, companion, onConflict: DoUpdate((_) => companion));
      }
    });
  } catch (error) {
    dPrint(() => "[MIGRATION] Error while migrating store values to SQLite: $error");
  }
}

Future<void> migrateStoreToIsar(Isar db, Drift drift) async {
  try {
    final driftStoreValues = await drift.storeEntity
        .select()
        .map((entity) => StoreValue(entity.id, intValue: entity.intValue, strValue: entity.stringValue))
        .get();

    await db.writeTxn(() async {
      await db.storeValues.putAll(driftStoreValues);
    });
  } catch (error) {
    dPrint(() => "[MIGRATION] Error while migrating store values to Isar: $error");
  }
}

class _DeviceAsset {
  final String assetId;
  final List<int>? hash;
  final DateTime? dateTime;

  const _DeviceAsset({required this.assetId, this.hash, this.dateTime});
}
