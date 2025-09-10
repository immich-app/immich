import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/exif.model.dart';
import 'package:immich_mobile/domain/models/stack.model.dart';
import 'package:immich_mobile/infrastructure/entities/exif.entity.dart' hide ExifInfo;
import 'package:immich_mobile/infrastructure/entities/exif.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/stack.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

class RemoteAssetRepository extends DriftDatabaseRepository {
  final Drift _db;
  const RemoteAssetRepository(this._db) : super(_db);

  /// For testing purposes
  Future<List<RemoteAsset>> getSome(String userId) {
    final query = _db.remoteAssetEntity.select()
      ..where(
        (row) =>
            _db.remoteAssetEntity.ownerId.equals(userId) &
            _db.remoteAssetEntity.deletedAt.isNull() &
            _db.remoteAssetEntity.visibility.equalsValue(AssetVisibility.timeline),
      )
      ..orderBy([(row) => OrderingTerm.desc(row.createdAt)])
      ..limit(10);

    return query.map((row) => row.toDto()).get();
  }

  SingleOrNullSelectable<RemoteAsset?> _assetSelectable(String id) {
    final query =
        _db.remoteAssetEntity.select().addColumns([_db.localAssetEntity.id]).join([
            leftOuterJoin(
              _db.localAssetEntity,
              _db.remoteAssetEntity.checksum.equalsExp(_db.localAssetEntity.checksum),
              useColumns: false,
            ),
          ])
          ..where(_db.remoteAssetEntity.id.equals(id))
          ..limit(1);

    return query.map((row) {
      final asset = row.readTable(_db.remoteAssetEntity).toDto();
      return asset.copyWith(localId: row.read(_db.localAssetEntity.id));
    });
  }

  Stream<RemoteAsset?> watch(String id) {
    return _assetSelectable(id).watchSingleOrNull();
  }

  Future<RemoteAsset?> get(String id) {
    return _assetSelectable(id).getSingleOrNull();
  }

  Future<RemoteAsset?> getByChecksum(String checksum) {
    final query = _db.remoteAssetEntity.select()..where((row) => row.checksum.equals(checksum));

    return query.map((row) => row.toDto()).getSingleOrNull();
  }

  Future<List<RemoteAsset>> getStackChildren(RemoteAsset asset) {
    if (asset.stackId == null) {
      return Future.value([]);
    }

    final query = _db.remoteAssetEntity.select()
      ..where((row) => row.stackId.equals(asset.stackId!) & row.id.equals(asset.id).not())
      ..orderBy([(row) => OrderingTerm.desc(row.createdAt)]);

    return query.map((row) => row.toDto()).get();
  }

  Future<ExifInfo?> getExif(String id) {
    return _db.managers.remoteExifEntity
        .filter((row) => row.assetId.id.equals(id))
        .map((row) => row.toDto())
        .getSingleOrNull();
  }

  Future<List<(String, String)>> getPlaces() {
    final asset = Subquery(
      _db.remoteAssetEntity.select()..orderBy([(row) => OrderingTerm.desc(row.createdAt)]),
      "asset",
    );

    final query =
        asset.selectOnly().join([
            innerJoin(
              _db.remoteExifEntity,
              _db.remoteExifEntity.assetId.equalsExp(asset.ref(_db.remoteAssetEntity.id)),
              useColumns: false,
            ),
          ])
          ..addColumns([_db.remoteExifEntity.city, _db.remoteExifEntity.assetId])
          ..where(
            _db.remoteExifEntity.city.isNotNull() &
                asset.ref(_db.remoteAssetEntity.deletedAt).isNull() &
                asset.ref(_db.remoteAssetEntity.visibility).equals(AssetVisibility.timeline.index),
          )
          ..groupBy([_db.remoteExifEntity.city])
          ..orderBy([OrderingTerm.asc(_db.remoteExifEntity.city)]);

    return query.map((row) {
      final assetId = row.read(_db.remoteExifEntity.assetId);
      final city = row.read(_db.remoteExifEntity.city);
      return (city!, assetId!);
    }).get();
  }

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

  Future<void> updateVisibility(List<String> ids, AssetVisibility visibility) {
    return _db.batch((batch) async {
      for (final id in ids) {
        batch.update(
          _db.remoteAssetEntity,
          RemoteAssetEntityCompanion(visibility: Value(visibility)),
          where: (e) => e.id.equals(id),
        );
      }
    });
  }

  Future<void> trash(List<String> ids) {
    return _db.batch((batch) async {
      for (final id in ids) {
        batch.update(
          _db.remoteAssetEntity,
          RemoteAssetEntityCompanion(deletedAt: Value(DateTime.now())),
          where: (e) => e.id.equals(id),
        );
      }
    });
  }

  Future<void> restoreTrash(List<String> ids) {
    return _db.batch((batch) async {
      for (final id in ids) {
        batch.update(
          _db.remoteAssetEntity,
          const RemoteAssetEntityCompanion(deletedAt: Value(null)),
          where: (e) => e.id.equals(id),
        );
      }
    });
  }

  Future<void> delete(List<String> ids) {
    return _db.remoteAssetEntity.deleteWhere((row) => row.id.isIn(ids));
  }

  Future<void> updateLocation(List<String> ids, LatLng location) {
    return _db.batch((batch) async {
      for (final id in ids) {
        batch.update(
          _db.remoteExifEntity,
          RemoteExifEntityCompanion(latitude: Value(location.latitude), longitude: Value(location.longitude)),
          where: (e) => e.assetId.equals(id),
        );
      }
    });
  }

  Future<void> updateDateTime(List<String> ids, DateTime dateTime) {
    return _db.batch((batch) async {
      for (final id in ids) {
        batch.update(
          _db.remoteExifEntity,
          RemoteExifEntityCompanion(dateTimeOriginal: Value(dateTime)),
          where: (e) => e.assetId.equals(id),
        );
        batch.update(
          _db.remoteAssetEntity,
          RemoteAssetEntityCompanion(createdAt: Value(dateTime)),
          where: (e) => e.id.equals(id),
        );
      }
    });
  }

  Future<void> stack(String userId, StackResponse stack) {
    return _db.transaction(() async {
      final stackIds = await _db.managers.stackEntity
          .filter((row) => row.primaryAssetId.isIn(stack.assetIds))
          .map((row) => row.id)
          .get();

      await _db.stackEntity.deleteWhere((row) => row.id.isIn(stackIds));

      await _db.batch((batch) {
        final companion = StackEntityCompanion(ownerId: Value(userId), primaryAssetId: Value(stack.primaryAssetId));

        batch.insert(_db.stackEntity, companion.copyWith(id: Value(stack.id)), onConflict: DoUpdate((_) => companion));

        for (final assetId in stack.assetIds) {
          batch.update(
            _db.remoteAssetEntity,
            RemoteAssetEntityCompanion(stackId: Value(stack.id)),
            where: (e) => e.id.equals(assetId),
          );
        }
      });
    });
  }

  Future<void> unStack(List<String> stackIds) {
    return _db.transaction(() async {
      await _db.stackEntity.deleteWhere((row) => row.id.isIn(stackIds));

      // TODO: delete this after adding foreign key on stackId
      await _db.batch((batch) {
        batch.update(
          _db.remoteAssetEntity,
          const RemoteAssetEntityCompanion(stackId: Value(null)),
          where: (e) => e.stackId.isIn(stackIds),
        );
      });
    });
  }

  Future<void> updateDescription(String assetId, String description) async {
    await (_db.remoteExifEntity.update()..where((row) => row.assetId.equals(assetId))).write(
      RemoteExifEntityCompanion(description: Value(description)),
    );
  }

  Future<int> getCount() {
    return _db.managers.remoteAssetEntity.count();
  }
}
