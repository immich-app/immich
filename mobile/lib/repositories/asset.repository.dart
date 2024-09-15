import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/user.entity.dart';
import 'package:immich_mobile/interfaces/asset.interface.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:isar/isar.dart';

final assetRepositoryProvider =
    Provider((ref) => AssetRepository(ref.watch(dbProvider)));

class AssetRepository implements IAssetRepository {
  final Isar _db;

  AssetRepository(
    this._db,
  );

  @override
  Future<List<Asset>> getByAlbumWithOwnerUnequal(Album album, User user) =>
      album.assets.filter().not().ownerIdEqualTo(user.isarId).findAll();

  @override
  Future<void> deleteById(List<int> ids) =>
      _db.writeTxn(() => _db.assets.deleteAll(ids));
}
