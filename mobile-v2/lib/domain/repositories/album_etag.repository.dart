import 'dart:async';

import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/entities/album_etag.entity.drift.dart';
import 'package:immich_mobile/domain/interfaces/album_etag.interface.dart';
import 'package:immich_mobile/domain/models/album_etag.model.dart';
import 'package:immich_mobile/domain/repositories/database.repository.dart';
import 'package:immich_mobile/utils/mixins/log.mixin.dart';

class AlbumETagRepository with LogMixin implements IAlbumETagRepository {
  final DriftDatabaseRepository _db;

  const AlbumETagRepository({required DriftDatabaseRepository db}) : _db = db;

  @override
  Future<bool> upsert(AlbumETag albumETag) async {
    try {
      final entity = _toEntity(albumETag);
      await _db.albumETag.insertOne(
        entity,
        onConflict: DoUpdate((_) => entity, target: [_db.albumETag.albumId]),
      );
      return true;
    } catch (e, s) {
      log.e("Error while adding an album etag to the DB", e, s);
    }
    return false;
  }

  @override
  Future<AlbumETag?> get(int albumId) async {
    final query = _db.albumETag.select()
      ..where((r) => r.albumId.equals(albumId));
    return await query.map(_toModel).getSingleOrNull();
  }

  @override
  Future<void> deleteAll() async {
    await _db.albumETag.deleteAll();
  }
}

AlbumETagCompanion _toEntity(AlbumETag albumETag) {
  return AlbumETagCompanion.insert(
    id: Value.absentIfNull(albumETag.id),
    albumId: albumETag.albumId,
    modifiedTime: Value(albumETag.modifiedTime),
    assetCount: Value(albumETag.assetCount),
  );
}

AlbumETag _toModel(AlbumETagData albumETag) {
  return AlbumETag(
    id: albumETag.id,
    albumId: albumETag.albumId,
    assetCount: albumETag.assetCount,
    modifiedTime: albumETag.modifiedTime,
  );
}
