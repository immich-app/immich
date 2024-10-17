import 'dart:async';

import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/entities/album_etag.entity.drift.dart';
import 'package:immich_mobile/domain/interfaces/album_etag.interface.dart';
import 'package:immich_mobile/domain/models/album_etag.model.dart';
import 'package:immich_mobile/domain/repositories/database.repository.dart';
import 'package:immich_mobile/utils/mixins/log.mixin.dart';

class AlbumETagRepository with LogMixin implements IAlbumETagRepository {
  final DriftDatabaseRepository _db;

  const AlbumETagRepository(this._db);

  @override
  FutureOr<bool> upsert(AlbumETag albumETag) async {
    try {
      final entity = _toEntity(albumETag);
      await _db.into(_db.albumETag).insert(
            entity,
            onConflict:
                DoUpdate((_) => entity, target: [_db.albumETag.albumId]),
          );
      return true;
    } catch (e, s) {
      log.e("Error while adding an album etag to the DB", e, s);
    }
    return false;
  }

  @override
  FutureOr<AlbumETag?> get(int albumId) async {
    return await _db.managers.albumETag
        .filter((r) => r.albumId.id.equals(albumId))
        .map(_toModel)
        .getSingleOrNull();
  }
}

AlbumETagCompanion _toEntity(AlbumETag albumETag) {
  return AlbumETagCompanion.insert(
    id: Value.absentIfNull(albumETag.id),
    modifiedTime: Value(albumETag.modifiedTime),
    albumId: albumETag.albumId,
    assetCount: Value(albumETag.assetCount),
  );
}

AlbumETag _toModel(AlbumETagData albumETag) {
  return AlbumETag(
    albumId: albumETag.albumId,
    assetCount: albumETag.assetCount,
    modifiedTime: albumETag.modifiedTime,
    id: albumETag.id,
  );
}
