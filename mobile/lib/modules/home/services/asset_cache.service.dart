import 'package:collection/collection.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:openapi/api.dart';

final assetCacheServiceProvider = Provider(
  (ref) => AssetCacheService(),
);

typedef CacheEntry = Map<dynamic, dynamic>;
typedef CacheList = List<CacheEntry>;

class AssetCacheService {
  final _cacheBox = Hive.box(assetListCacheBox);

  bool isValid() {
    return _cacheBox.containsKey(assetListCachedAssets) && _rawGet().isNotEmpty;
  }

  void putAssets(List<AssetResponseDto> assets) {
    _rawPut(assets.map((e) => _serialize(e)).toList());
  }

  List<AssetResponseDto> getAssets() {
    return _rawGet().map((e) => _deserialize(e)).whereNotNull().toList();
  }

  Future<List<AssetResponseDto>> getAssetsAsync() async {
    return Future.microtask(() => getAssets());
  }

  List<dynamic> _rawGet() {
    return _cacheBox.get(assetListCachedAssets) as List<dynamic>;
  }

  void _rawPut(CacheList data) {
    _cacheBox.put(assetListCachedAssets, data);
  }

  CacheEntry _serialize(AssetResponseDto a) {
    return {
      "id": a.id,
      "cat": a.createdAt,
      "did": a.deviceAssetId,
      "oid": a.ownerId,
      "dev": a.deviceId,
      "dur": a.duration,
      "mat": a.modifiedAt,
      "opa": a.originalPath,
      "typ": a.type.value,
      "exif": a.exifInfo?.toJson(),
      "fav": a.isFavorite,
      "evp": a.encodedVideoPath,
      "mim": a.mimeType,
      "rsp": a.resizePath,
      "wbp": a.webpPath,
    };
  }

  AssetResponseDto? _deserialize(CacheEntry map) {
    try {
      return AssetResponseDto(
        type: AssetTypeEnum.values
            .firstWhere((element) => element.value == map["typ"]),
        id: map["id"],
        deviceAssetId: map["did"],
        ownerId: map["oid"],
        deviceId: map["dev"],
        originalPath: map["opa"],
        resizePath: map["rsp"],
        createdAt: map["cat"],
        modifiedAt: map["mat"],
        isFavorite: map["fav"],
        mimeType: map["mim"],
        duration: map["dur"],
        webpPath: map["wbp"],
        encodedVideoPath: map["evp"],
      );
    } catch (e) {
      return null;
    }
  }
}
