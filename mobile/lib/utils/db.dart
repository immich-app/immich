import 'package:immich_mobile/modules/album/models/album.model.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/etag.dart';
import 'package:immich_mobile/shared/models/exif_info.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/shared/models/user.dart';
import 'package:isar/isar.dart';

Future<void> clearAssetsAndAlbums(Isar db) async {
  await Store.delete(StoreKey.assetETag);
  await db.writeTxn(() async {
    await db.assets.clear();
    await db.exifInfos.clear();
    await db.localAlbums.clear();
    await db.remoteAlbums.clear();
    await db.eTags.clear();
    await db.users.clear();
  });
}
