import 'package:drift/drift.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';

import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import "package:immich_mobile/utils/database.utils.dart";

final backupRepositoryProvider = Provider<DriftBackupRepository>(
  (ref) => DriftBackupRepository(ref.watch(driftProvider)),
);

class DriftBackupRepository extends DriftDatabaseRepository {
  final Drift _db;
  const DriftBackupRepository(this._db) : super(_db);

  Future<List<LocalAsset>> getAssets(String albumId) {
    final query = _db.localAlbumAssetEntity.select().join(
      [
        innerJoin(
          _db.localAssetEntity,
          _db.localAlbumAssetEntity.assetId.equalsExp(_db.localAssetEntity.id),
        ),
      ],
    )
      ..where(_db.localAlbumAssetEntity.albumId.equals(albumId))
      ..orderBy([OrderingTerm.asc(_db.localAssetEntity.id)]);
    return query
        .map((row) => row.readTable(_db.localAssetEntity).toDto())
        .get();
  }

  Future<List<String>> getAssetIds(String albumId) {
    final query = _db.localAlbumAssetEntity.selectOnly()
      ..addColumns([_db.localAlbumAssetEntity.assetId])
      ..where(_db.localAlbumAssetEntity.albumId.equals(albumId));
    return query
        .map((row) => row.read(_db.localAlbumAssetEntity.assetId)!)
        .get();
  }

  Future<int> getTotalCount() async {
    final excludedAssetIds = await _getExcludedAssetIds();

    final query = _db.localAlbumAssetEntity.selectOnly(distinct: true)
      ..addColumns([_db.localAlbumAssetEntity.assetId])
      ..join([
        innerJoin(
          _db.localAlbumEntity,
          _db.localAlbumAssetEntity.albumId.equalsExp(_db.localAlbumEntity.id),
        ),
      ])
      ..where(
        _db.localAlbumEntity.backupSelection
                .equals(BackupSelection.selected.index) &
            (excludedAssetIds.isEmpty
                ? const Constant(true)
                : _db.localAlbumAssetEntity.assetId.isNotIn(excludedAssetIds)),
      );

    return query.get().then((rows) => rows.length);
  }

  Future<int> getRemainderCount() async {
    final excludedAssetIds = await _getExcludedAssetIds();

    final query = _db.localAlbumAssetEntity.selectOnly(distinct: true)
      ..addColumns(
        [_db.localAlbumAssetEntity.assetId],
      )
      ..join([
        innerJoin(
          _db.localAlbumEntity,
          _db.localAlbumAssetEntity.albumId.equalsExp(_db.localAlbumEntity.id),
        ),
        innerJoin(
          _db.localAssetEntity,
          _db.localAlbumAssetEntity.assetId.equalsExp(_db.localAssetEntity.id),
        ),
        leftOuterJoin(
          _db.remoteAssetEntity,
          _db.localAssetEntity.checksum
              .equalsExp(_db.remoteAssetEntity.checksum),
        ),
      ])
      ..where(
        _db.localAlbumEntity.backupSelection
                .equals(BackupSelection.selected.index) &
            _db.remoteAssetEntity.checksum.isNull() &
            (excludedAssetIds.isEmpty
                ? const Constant(true)
                : _db.localAlbumAssetEntity.assetId.isNotIn(excludedAssetIds)),
      );

    return query.get().then((rows) => rows.length);
  }

  Future<int> getBackupCount() async {
    final excludedAssetIds = await _getExcludedAssetIds();
    final query = _db.localAlbumAssetEntity.selectOnly(distinct: true)
      ..addColumns(
        [_db.localAlbumAssetEntity.assetId],
      )
      ..join([
        innerJoin(
          _db.localAlbumEntity,
          _db.localAlbumAssetEntity.albumId.equalsExp(_db.localAlbumEntity.id),
        ),
        innerJoin(
          _db.localAssetEntity,
          _db.localAlbumAssetEntity.assetId.equalsExp(_db.localAssetEntity.id),
        ),
        innerJoin(
          _db.remoteAssetEntity,
          _db.localAssetEntity.checksum
              .equalsExp(_db.remoteAssetEntity.checksum),
        ),
      ])
      ..where(
        _db.localAlbumEntity.backupSelection
                .equals(BackupSelection.selected.index) &
            _db.remoteAssetEntity.checksum.isNotNull() &
            (excludedAssetIds.isEmpty
                ? const Constant(true)
                : _db.localAlbumAssetEntity.assetId.isNotIn(excludedAssetIds)),
      );

    return query.get().then((rows) => rows.length);
  }

  Future<List<String>> _getExcludedAssetIds() async {
    final query = _db.localAlbumAssetEntity.selectOnly()
      ..addColumns([_db.localAlbumAssetEntity.assetId])
      ..join([
        innerJoin(
          _db.localAlbumEntity,
          _db.localAlbumAssetEntity.albumId.equalsExp(_db.localAlbumEntity.id),
        ),
      ])
      ..where(
        _db.localAlbumEntity.backupSelection
            .equals(BackupSelection.excluded.index),
      );

    return query
        .map((row) => row.read(_db.localAlbumAssetEntity.assetId)!)
        .get();
  }

  Future<List<LocalAlbum>> getBackupAlbums(BackupSelection selectionType) {
    final query = _db.localAlbumEntity.select()
      ..where(
        (tbl) => tbl.backupSelection.equals(selectionType.index),
      );

    return query.map((localAlbum) => localAlbum.toDto(assetCount: 0)).get();
  }

  Future<List<LocalAsset>> getCandidates() async {
    final excludedAssetIds = await _getExcludedAssetIds();
    final selectedAlbums = await getBackupAlbums(BackupSelection.selected);
    final selectedAlbumIds = selectedAlbums.map((album) => album.id).toList();

    final query = _db.localAssetEntity.select()
      ..where(
        (lae) =>
            existsQuery(
              _db.localAlbumAssetEntity.selectOnly()
                ..addColumns([_db.localAlbumAssetEntity.assetId])
                ..where(
                  _db.localAlbumAssetEntity.albumId.isIn(selectedAlbumIds) &
                      _db.localAlbumAssetEntity.assetId.equalsExp(lae.id),
                ),
            ) &
            notExistsQuery(
              _db.remoteAssetEntity.selectOnly()
                ..addColumns([_db.remoteAssetEntity.checksum])
                ..where(
                  _db.remoteAssetEntity.checksum.equalsExp(lae.checksum) &
                      lae.checksum.isNotNull(),
                ),
            ) &
            (excludedAssetIds.isEmpty
                ? const Constant(true)
                : lae.id.isNotIn(excludedAssetIds)),
      );

    return query.map((localAsset) => localAsset.toDto()).get();
  }
}
