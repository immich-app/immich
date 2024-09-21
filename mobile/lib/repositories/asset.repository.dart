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
  Future<List<Asset>> getByAlbum(Album album, {User? notOwnedBy}) {
    var query = album.assets.filter();
    if (notOwnedBy != null) {
      query = query.not().ownerIdEqualTo(notOwnedBy.isarId);
    }
    return query.findAll();
  }

  @override
  Future<void> deleteById(List<int> ids) =>
      _db.writeTxn(() => _db.assets.deleteAll(ids));

  @override
  Future<Asset?> getByRemoteId(String id) => _db.assets.getByRemoteId(id);

  @override
  Future<List<Asset>> getAllByRemoteId(Iterable<String> ids) =>
      _db.assets.getAllByRemoteId(ids);
}
