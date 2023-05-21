import 'dart:async';

import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/utils/db.dart';
import 'package:isar/isar.dart';

Future<void> migrateDatabaseIfNeeded(Isar db) async {
  final int version = Store.get(StoreKey.version, 1);
  switch (version) {
    case 1:
      await _migrateV1ToV2(db);
  }
}

Future<void> _migrateV1ToV2(Isar db) async {
  await clearAssetsAndAlbums(db);
  await Store.put(StoreKey.version, 2);
}
