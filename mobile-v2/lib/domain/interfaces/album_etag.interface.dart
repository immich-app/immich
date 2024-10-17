import 'dart:async';

import 'package:immich_mobile/domain/models/album_etag.model.dart';

abstract interface class IAlbumETagRepository {
  /// Inserts or updates the album etag for the given [albumId]
  FutureOr<bool> upsert(AlbumETag albumETag);

  /// Fetches the album etag for the given [albumId]
  FutureOr<AlbumETag?> get(int albumId);
}
