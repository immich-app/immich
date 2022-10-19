
import 'package:collection/collection.dart';
import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/services/json_cache.dart';
import 'package:openapi/api.dart';

class BaseAlbumCacheService extends JsonCache<List<AlbumResponseDto>> {
  BaseAlbumCacheService(super.cacheFileName);

  @override
  void put(List<AlbumResponseDto> data) {
    putRawData(data.map((e) => e.toJson()).toList());
  }

  @override
  Future<List<AlbumResponseDto>> get() async {
    try {
      final mapList = await readRawData() as List<dynamic>;

      final responseData = mapList
          .map((e) => AlbumResponseDto.fromJson(e))
          .whereNotNull()
          .toList();

      return responseData;
    } catch (e) {
      debugPrint(e.toString());
      return [];
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

