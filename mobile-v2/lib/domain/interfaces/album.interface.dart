import 'dart:async';

import 'package:immich_mobile/domain/models/album.model.dart';

abstract interface class IAlbumRepository {
  /// Inserts a new album into the DB or updates if existing and returns the updated data
  FutureOr<Album?> upsert(Album album);

  /// Fetch all albums
  FutureOr<List<Album>> getAll({bool localOnly, bool remoteOnly});

  /// Removes album with the given [id]
  FutureOr<void> deleteId(int id);

  /// Removes all albums
  FutureOr<void> deleteAll();
}
