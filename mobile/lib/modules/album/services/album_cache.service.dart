
import 'package:collection/collection.dart';
import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/services/asset_cache.service.dart';
import 'package:openapi/api.dart';

class AlbumCacheService extends JsonCache<List<AlbumResponseDto>> {
  AlbumCacheService() : super("album_cache");

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

final albumCacheServiceProvider = Provider(
      (ref) => AlbumCacheService(),
);
