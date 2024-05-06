import 'dart:async';

import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/utils/db.dart';
import 'package:isar/isar.dart';

const int targetVersion = 6;

Future<void> migrateDatabaseIfNeeded(Isar db) async {
  final int version = Store.get(StoreKey.version, 1);
  if (version < targetVersion) {
    _migrateTo(db, targetVersion);
  }
}

Future<void> _migrateTo(Isar db, int version) async {
  await clearAssetsAndAlbums(db);
  await Store.put(StoreKey.version, version);
}
