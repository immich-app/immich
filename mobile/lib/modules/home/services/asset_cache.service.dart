import 'package:collection/collection.dart';
import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/services/json_cache.dart';

class AssetCacheService extends JsonCache<List<Asset>> {
  AssetCacheService() : super("asset_cache");

  @override
  void put(List<Asset> data) {
    putRawData(data.map((e) => e.toJson()).toList());
  }

  @override
  Future<List<Asset>> get() async {
    try {
      final mapList = await readRawData() as List<dynamic>;

      final responseData =
          mapList.map((e) => Asset.fromJson(e)).whereNotNull().toList();

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
