import 'dart:async';

import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/entities/album.entity.drift.dart';
import 'package:immich_mobile/domain/interfaces/album.interface.dart';
import 'package:immich_mobile/domain/models/album.model.dart';
import 'package:immich_mobile/domain/repositories/database.repository.dart';
import 'package:immich_mobile/utils/mixins/log.mixin.dart';

class AlbumRepository with LogMixin implements IAlbumRepository {
  final DriftDatabaseRepository _db;

  const AlbumRepository({required DriftDatabaseRepository db}) : _db = db;

  @override
  FutureOr<Album?> upsert(Album album) async {
    try {
      final albumData = _toEntity(album);
      final data = await _db.album.insertReturningOrNull(
        albumData,
        onConflict: DoUpdate((_) => albumData, target: [_db.album.localId]),
      );
      if (data != null) {
        return _toModel(data);
      }
    } catch (e, s) {
      log.e("Error while adding an album to the DB", e, s);
    }
    return null;
  }

  @override
  FutureOr<List<Album>> getAll({
    bool localOnly = false,
    bool remoteOnly = false,
  }) async {
    final query = _db.album.select();

    if (localOnly == true) {
      query.where((album) => album.localId.isNotNull());
    }

    if (remoteOnly == true) {
      query.where((album) => album.remoteId.isNotNull());
    }

    query.orderBy([(album) => OrderingTerm.asc(album.name)]);
    return await query.map(_toModel).get();
  }

  @override
  FutureOr<void> deleteId(int id) async {
    await _db.asset.deleteWhere((row) => row.id.equals(id));
  }
}

AlbumCompanion _toEntity(Album album) {
  return AlbumCompanion.insert(
    id: Value.absentIfNull(album.id),
    localId: Value(album.localId),
    remoteId: Value(album.remoteId),
    name: album.name,
    modifiedTime: Value(album.modifiedTime),
    thumbnailAssetId: Value(album.thumbnailAssetId),
  );
}

Album _toModel(AlbumData album) {
  return Album(
    id: album.id,
    localId: album.localId,
    remoteId: album.remoteId,
    name: album.name,
    modifiedTime: album.modifiedTime,
  );
}
