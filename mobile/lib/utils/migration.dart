// ignore_for_file: deprecated_member_use_from_same_package

import 'package:flutter/cupertino.dart';
import 'package:hive/hive.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/modules/album/services/album_cache.service.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/shared/services/asset_cache.service.dart';

Future<void> migrateHiveToStoreIfNecessary() async {
  try {
    if (await Hive.boxExists(userInfoBox)) {
      final Box box = await Hive.openBox(userInfoBox);
      await _migrateSingleKey(box, userIdKey, StoreKey.userRemoteId);
      await _migrateSingleKey(box, assetEtagKey, StoreKey.assetETag);
    }
  } catch (e) {
    debugPrint("Error while migrating userInfoBox $e");
  }
}

_migrateSingleKey(Box box, String hiveKey, StoreKey key) async {
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
