import 'dart:convert';

import 'package:collection/collection.dart';
import 'package:flutter/foundation.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:http/http.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:openapi/api.dart';

abstract class JsonCache<T> {
  final String boxName;
  final String valueKey;
  final Box _cacheBox;

  JsonCache(this.boxName, this.valueKey) : _cacheBox = Hive.box(boxName);

  bool isValid() {
    return _cacheBox.containsKey(valueKey) && _cacheBox.get(valueKey) is String;
  }

  void invalidate() {
    _cacheBox.clear();
  }

  void putRawData(dynamic data) {
    final jsonString = json.encode(data);
    _cacheBox.put(valueKey, jsonString);
  }

  dynamic readRawData() {
    return json.decode(_cacheBox.get(valueKey));
  }

  void put(T data);

  T get();

  Future<T> getAsync() async {
    return Future.microtask(() => get());
  }
}

class AssetCacheService extends JsonCache<List<AssetResponseDto>> {
  AssetCacheService() : super(assetListCacheBox, assetListCachedAssets);

  @override
  void put(List<AssetResponseDto> data) {
    putRawData(data.map((e) => e.toJson()).toList());
  }

  @override
  List<AssetResponseDto> get() {
    try {
      final mapList =  readRawData() as List<dynamic>;

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

}

final assetCacheServiceProvider = Provider(
      (ref) => AssetCacheService(),
);
