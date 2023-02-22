import 'package:collection/collection.dart';
import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/models/album.dart';
import 'package:immich_mobile/shared/services/json_cache.dart';

class BaseAlbumCacheService extends JsonCache<List<Album>> {
  BaseAlbumCacheService(super.cacheFileName);

  @override
  void put(List<Album> data) {
    putRawData(data.map((e) => e.toJson()).toList());
  }

  @override
  Future<List<Album>?> get() async {
    try {
      final mapList = await readRawData() as List<dynamic>;

      final responseData =
          mapList.map((e) => Album.fromJson(e)).whereNotNull().toList();

      return responseData;
    } catch (e) {
      await invalidate();
      debugPrint(e.toString());
      return null;
    }
  }
}

class AlbumCacheService extends BaseAlbumCacheService {
  AlbumCacheService() : super("album_cache");
}

class SharedAlbumCacheService extends BaseAlbumCacheService {
  SharedAlbumCacheService() : super("shared_album_cache");
}

final albumCacheServiceProvider = Provider(
  (ref) => AlbumCacheService(),
);

final sharedAlbumCacheServiceProvider = Provider(
  (ref) => SharedAlbumCacheService(),
);
