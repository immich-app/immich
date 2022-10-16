import 'dart:convert';

import 'package:collection/collection.dart';
import 'package:flutter/foundation.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:openapi/api.dart';

final assetCacheServiceProvider = Provider(
  (ref) => AssetCacheService(),
);

class AssetCacheService {
  final _cacheBox = Hive.box(assetListCacheBox);

  bool isValid() {
    return _cacheBox.containsKey(assetListCachedAssets) &&
        _cacheBox.get(assetListCachedAssets) is String;
  }

  void invalidate() {
    _cacheBox.clear();
  }

  void putAssets(List<AssetResponseDto> assets) {
    final mapList = assets.map((e) => e.toJson()).toList();
    final jsonString = json.encode(mapList);

    _cacheBox.put(assetListCachedAssets, jsonString);
  }

  List<AssetResponseDto> getAssets() {
    try {
      final jsonString = _cacheBox.get(assetListCachedAssets);
      final mapList = json.decode(jsonString) as List<dynamic>;

      final responseData = mapList
          .map((e) => AssetResponseDto.fromJson(e))
          .whereNotNull()
          .toList();

      return responseData;
    } catch (e) {
      debugPrint(e.toString());

      return [];
    }
  }

  Future<List<AssetResponseDto>> getAssetsAsync() async {
    return Future.microtask(() => getAssets());
  }
}
