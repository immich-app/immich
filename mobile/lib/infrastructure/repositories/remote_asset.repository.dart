import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/exif.model.dart';
import 'package:immich_mobile/domain/models/stack.model.dart';
import 'package:immich_mobile/infrastructure/entities/exif.entity.dart'
    hide ExifInfo;
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
            _db.remoteAssetEntity.visibility
                .equalsValue(AssetVisibility.timeline),
      )
      ..orderBy([(row) => OrderingTerm.desc(row.createdAt)])
      ..limit(10);

    return query.map((row) => row.toDto()).get();
  }

  Stream<RemoteAsset?> watchAsset(String id) {
    final stackCountRef = _db.stackEntity.id.count();

    final query = _db.remoteAssetEntity.select().addColumns([
      _db.localAssetEntity.id,
      _db.stackEntity.primaryAssetId,
      stackCountRef,
    ]).join([
      leftOuterJoin(
        _db.localAssetEntity,
        _db.remoteAssetEntity.checksum.equalsExp(_db.localAssetEntity.checksum),
        useColumns: false,
      ),
      leftOuterJoin(
        _db.stackEntity,
        _db.stackEntity.primaryAssetId.equalsExp(_db.remoteAssetEntity.id),
        useColumns: false,
      ),
      leftOuterJoin(
        _db.remoteAssetEntity.createAlias('stacked_assets'),
        _db.stackEntity.id.equalsExp(
          _db.remoteAssetEntity.createAlias('stacked_assets').stackId,
        ),
        useColumns: false,
      ),
    ])
      ..where(_db.remoteAssetEntity.id.equals(id))
      ..groupBy([
        _db.remoteAssetEntity.id,
        _db.localAssetEntity.id,
        _db.stackEntity.primaryAssetId,
      ]);

    return query.map((row) {
      final asset = row.readTable(_db.remoteAssetEntity).toDto();
      final primaryAssetId = row.read(_db.stackEntity.primaryAssetId);
      final stackCount =
          primaryAssetId == id ? (row.read(stackCountRef) ?? 0) : 0;

      return asset.copyWith(
        localId: row.read(_db.localAssetEntity.id),
        stackCount: stackCount,
      );
    }).watchSingleOrNull();
  }

  Future<List<RemoteAsset>> getStackChildren(RemoteAsset asset) {
    if (asset.stackId == null) {
      return Future.value([]);
    }

    final query = _db.remoteAssetEntity.select()
      ..where(
        (row) =>
            row.stackId.equals(asset.stackId!) & row.id.equals(asset.id).not(),
      )
      ..orderBy([(row) => OrderingTerm.desc(row.createdAt)]);

    return query.map((row) => row.toDto()).get();
  }

  Future<ExifInfo?> getExif(String id) {
    return _db.managers.remoteExifEntity
        .filter((row) => row.assetId.id.equals(id))
        .map((row) => row.toDto())
        .getSingleOrNull();
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

  Future<void> delete(List<String> ids) {
    return _db.remoteAssetEntity.deleteWhere((row) => row.id.isIn(ids));
  }

  Future<void> updateLocation(List<String> ids, LatLng location) {
    return _db.batch((batch) async {
      for (final id in ids) {
        batch.update(
          _db.remoteExifEntity,
          RemoteExifEntityCompanion(
            latitude: Value(location.latitude),
            longitude: Value(location.longitude),
          ),
          where: (e) => e.assetId.equals(id),
        );
      }
    });
  }

  Future<void> stack(String userId, StackResponse stack) {
    return _db.transaction(() async {
      final stackIds = await _db.managers.stackEntity
        .filter((row) => row.primaryAssetId.id.isIn(stack.assetIds))
        .map((row) => row.id)
        .get();

      await _db.stackEntity.deleteWhere((row) => row.id.isIn(stackIds));

      await _db.batch((batch) {
        final companion = StackEntityCompanion(
          ownerId: Value(userId),
          primaryAssetId: Value(stack.primaryAssetId),
        );

        batch.insert(
          _db.stackEntity,
          companion.copyWith(id: Value(stack.id)),
          onConflict: DoUpdate((_) => companion),
        );

        for (final assetId in stack.assetIds) {
          batch.update(
            _db.remoteAssetEntity,
            RemoteAssetEntityCompanion(
              stackId: Value(stack.id),
            ),
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
}
