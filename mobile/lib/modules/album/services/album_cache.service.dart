import 'package:immich_mobile/shared/models/album.dart';
import 'package:immich_mobile/shared/services/json_cache.dart';

@Deprecated("only kept to remove its files after migration")
class _BaseAlbumCacheService extends JsonCache<List<Album>> {
  _BaseAlbumCacheService(super.cacheFileName);

  @override
  void put(List<Album> data) {}

  @override
  Future<List<Album>?> get() => Future.value(null);
}

@Deprecated("only kept to remove its files after migration")
class AlbumCacheService extends _BaseAlbumCacheService {
  AlbumCacheService() : super("album_cache");
}

@Deprecated("only kept to remove its files after migration")
class SharedAlbumCacheService extends _BaseAlbumCacheService {
  SharedAlbumCacheService() : super("shared_album_cache");
}
