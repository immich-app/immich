import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/etag.entity.dart';
import 'package:immich_mobile/entities/exif_info.entity.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/entities/user.entity.dart';
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

  static Future<void> clearUsers(Isar db) async {
    await Store.delete(StoreKey.currentUser);
    await Store.delete(StoreKey.accessToken);
    await db.writeTxn(() async {
      await db.users.clear();
    });
  }
}
