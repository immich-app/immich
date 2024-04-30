import 'package:immich_mobile/domain/entities/album.entity.dart';
import 'package:immich_mobile/domain/entities/asset.entity.dart';
import 'package:immich_mobile/domain/entities/etag.entity.dart';
import 'package:immich_mobile/domain/entities/exif_info.entity.dart';
import 'package:immich_mobile/domain/entities/store.entity.dart';
import 'package:immich_mobile/domain/entities/user.entity.dart';
import 'package:isar/isar.dart';

Future<void> clearAssetsAndAlbums(Isar db) async {
  await Store.delete(StoreKey.assetETag);
  await db.writeTxn(() async {
    await db.assets.clear();
    await db.exifInfos.clear();
    await db.albums.clear();
    await db.eTags.clear();
    await db.users.clear();
  });
}
