import 'package:drift/drift.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';

final remoteAssetRepositoryProvider = Provider<RemoteAssetRepository>(
  (ref) => RemoteAssetRepository(ref.watch(driftProvider)),
);

class RemoteAssetRepository extends DriftDatabaseRepository {
  final Drift _db;
  const RemoteAssetRepository(this._db) : super(_db);

  Future<void> updateFavorite(List<String> ids, bool isFavorite) {
    return _db.batch((batch) async {
      for (final id in ids) {
        batch.update(
          _db.remoteAssetEntity,
          RemoteAssetEntityCompanion(isFavorite: Value(isFavorite)),
          where: (e) => e.id.equals(id),
        );
      }
    });
  }
}
