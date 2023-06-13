import 'dart:async';

import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/utils/db.dart';
import 'package:isar/isar.dart';

Future<void> migrateDatabaseIfNeeded(Isar db) async {
  final int version = Store.get(StoreKey.version, 1);
  switch (version) {
    case 1:
      await _migrateTo(db, 2);
    case 2:
      await _migrateTo(db, 3);
  }
}

Future<void> _migrateTo(Isar db, int version) async {
  await clearAssetsAndAlbums(db);
  await Store.put(StoreKey.version, version);
}
