import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/exif_info.entity.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:isar/isar.dart';
import 'package:openapi/api.dart';

class AssetDescriptionService {
  AssetDescriptionService(this._db, this._api);

  final Isar _db;
  final ApiService _api;

  Future<void> setDescription(
    Asset asset,
    String newDescription,
  ) async {
    final remoteAssetId = asset.remoteId;
    final localExifId = asset.exifInfo?.id;

    // Guard [remoteAssetId] and [localExifId] null
    if (remoteAssetId == null || localExifId == null) {
      return;
    }

    final result = await _api.assetsApi.updateAsset(
      remoteAssetId,
      UpdateAssetDto(description: newDescription),
    );

    final description = result?.exifInfo?.description;

    if (description != null) {
      var exifInfo = await _db.exifInfos.get(localExifId);

      if (exifInfo != null) {
        exifInfo.description = description;
        await _db.writeTxn(
          () => _db.exifInfos.put(exifInfo),
        );
      }
    }
  }
}

final assetDescriptionServiceProvider = Provider(
  (ref) => AssetDescriptionService(
    ref.watch(dbProvider),
    ref.watch(apiServiceProvider),
  ),
);
