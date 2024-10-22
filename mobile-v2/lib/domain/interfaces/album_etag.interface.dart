import 'dart:async';

import 'package:immich_mobile/domain/models/album_etag.model.dart';

abstract interface class IAlbumETagRepository {
  /// Inserts or updates the album etag for the given [albumId]
  Future<bool> upsert(AlbumETag albumETag);

  /// Fetches the album etag for the given [albumId]
  Future<AlbumETag?> get(int albumId);

  /// Removes all album eTags
  Future<void> deleteAll();
}
