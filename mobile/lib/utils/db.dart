import 'package:immich_mobile/modules/backup/models/backup_album.model.dart';
import 'package:immich_mobile/shared/models/album.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/etag.dart';
import 'package:immich_mobile/shared/models/exif_info.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/shared/models/user.dart';
import 'package:isar/isar.dart';

class DBUtils {
  DBUtils._();

  static const _dbVersion = 5;

  static Future<void> migrateDatabaseIfNeeded(Isar db) async {
    final int version = Store.get(StoreKey.version, 1);
    switch (version) {
      case > 0 && < _dbVersion:
        await _migrateTo(db, _dbVersion);
    }
  }

  static Future<void> _migrateTo(Isar db, int version) async {
    await DBUtils.clearAssetsAndAlbums(db);
    await DBUtils.clearUsers(db);
    await Store.put(StoreKey.version, version);
  }

  static Future<void> clearAssetsAndAlbums(Isar db) async {
    await Store.delete(StoreKey.assetETag);
    await db.writeTxn(() async {
      await db.assets.clear();
      await db.exifInfos.clear();
      await db.albums.clear();
      await db.eTags.clear();
    });
  }

  static Future<void> clearBackupSettings(Isar db) async {
    await Store.delete(StoreKey.autoBackup);
    await Store.delete(StoreKey.backgroundBackup);
    await Store.delete(StoreKey.backupFailedSince);
    await Store.delete(StoreKey.backupRequireWifi);
    await Store.delete(StoreKey.backupRequireCharging);
    await Store.delete(StoreKey.backupTriggerDelay);
    await Store.delete(StoreKey.ignoreIcloudAssets);
    await db.writeTxn(() async {
      await db.backupAlbums.clear();
    });
  }

  static Future<void> clearUsers(Isar db) async {
    await Store.delete(StoreKey.currentUser);
    await Store.delete(StoreKey.accessToken);
    await db.writeTxn(() async {
      await db.users.clear();
    });
  }
}
