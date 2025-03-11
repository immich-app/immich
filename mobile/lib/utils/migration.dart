import 'dart:async';

import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/etag.entity.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/entities/exif.entity.dart';
import 'package:immich_mobile/infrastructure/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.dart';
import 'package:isar/isar.dart';

const int targetVersion = 9;

Future<void> migrateDatabaseIfNeeded(Isar db) async {
  final int version = Store.get(StoreKey.version, 1);

  if (version < 9) {
    await Store.put(StoreKey.version, version);
    final value = await db.storeValues.get(StoreKey.currentUser.id);
    if (value != null) {
      final id = value.intValue;
      if (id == null) {
        return;
      }
      final user = await db.users.get(id);
      await db.storeValues
          .put(StoreValue(StoreKey.currentUser.id, strValue: user?.id));
    }
    // Do not clear other entities
    return;
  }

  if (version < targetVersion) {
    _migrateTo(db, targetVersion);
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
