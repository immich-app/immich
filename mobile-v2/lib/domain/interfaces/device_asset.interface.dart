import 'dart:async';
import 'dart:io';
import 'dart:typed_data';

import 'package:immich_mobile/domain/models/asset.model.dart';
import 'package:immich_mobile/domain/models/device_asset_download.model.dart';
import 'package:immich_mobile/utils/constants/globals.dart';

abstract interface class IDeviceAssetRepository<T> {
  /// Fetches the [File] for the given [assetId]
  Future<File?> getOriginalFile(String assetId);

  /// Fetches the thumbnail for the given [assetId]
  Future<Uint8List?> getThumbnail(
    String assetId, {
    int width = kGridThumbnailSize,
    int height = kGridThumbnailSize,
    int quality = kGridThumbnailQuality,
    DeviceAssetDownloadHandler? downloadHandler,
  });

  /// Converts the given [entity] to an [Asset]
  Future<Asset> toAsset(T entity);
}
