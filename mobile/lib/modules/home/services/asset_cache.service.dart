import 'package:collection/collection.dart';
import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/services/json_cache.dart';

class AssetCacheService extends JsonCache<List<Asset>> {
  AssetCacheService() : super("asset_cache");

  static Future<List<Map<String, dynamic>>> _computeSerialize(
    List<Asset> assets,
  ) async {
    return assets.map((e) => e.toJson()).toList();
  }

  @override
  void put(List<Asset> data) async {
    putRawData(await compute(_computeSerialize, data));
  }

  static Future<List<Asset>> _computeEncode(List<dynamic> data) async {
    return data.map((e) => Asset.fromJson(e)).whereNotNull().toList();
  }

  @override
  Future<List<Asset>> get() async {
    try {
      final mapList = await readRawData() as List<dynamic>;

      final responseData = await compute(_computeEncode, mapList);

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
