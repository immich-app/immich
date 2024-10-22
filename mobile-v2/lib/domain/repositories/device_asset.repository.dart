import 'dart:async';
import 'dart:io';
import 'dart:typed_data';

import 'package:immich_mobile/domain/interfaces/device_asset.interface.dart';
import 'package:immich_mobile/domain/models/asset.model.dart';
import 'package:immich_mobile/domain/models/device_asset_download.model.dart';
import 'package:immich_mobile/utils/constants/globals.dart';
import 'package:immich_mobile/utils/mixins/log.mixin.dart';
import 'package:photo_manager/photo_manager.dart' as ph;

class DeviceAssetRepository
    with LogMixin
    implements IDeviceAssetRepository<ph.AssetEntity> {
  const DeviceAssetRepository();

  @override
  Future<Asset> toAsset(ph.AssetEntity entity) async {
    return Asset(
      name: await entity.titleAsync,
      hash: '',
      height: entity.height,
      width: entity.width,
      type: _toAssetType(entity.type),
      createdTime: entity.createDateTime.year == 1970
          ? entity.modifiedDateTime
          : entity.createDateTime,
      modifiedTime: entity.modifiedDateTime,
      duration: entity.duration,
      localId: entity.id,
    );
  }

  @override
  Future<File?> getOriginalFile(String localId) async {
    try {
      final entity = await ph.AssetEntity.fromId(localId);
      if (entity == null) {
        return null;
      }

      return await entity.originFile;
    } catch (e, s) {
      log.e("Exception while fetching file for localId - $localId", e, s);
    }
    return null;
  }

  @override
  Future<Uint8List?> getThumbnail(
    String assetId, {
    int width = kGridThumbnailSize,
    int height = kGridThumbnailSize,
    int quality = kGridThumbnailQuality,
    DeviceAssetDownloadHandler? downloadHandler,
  }) async {
    try {
      final entity = await ph.AssetEntity.fromId(assetId);
      if (entity == null) {
        return null;
      }

      ph.PMProgressHandler? progressHandler;
      if (downloadHandler != null) {
        progressHandler = ph.PMProgressHandler();
        downloadHandler.stream = progressHandler.stream.map(_toDownloadState);
      }

      return await entity.thumbnailDataWithSize(
        ph.ThumbnailSize(width, height),
        quality: quality,
        progressHandler: progressHandler,
      );
    } catch (e, s) {
      log.e("Exception while fetching thumbnail for assetId - $assetId", e, s);
    }
    return null;
  }
}

AssetType _toAssetType(ph.AssetType type) => switch (type) {
      ph.AssetType.audio => AssetType.audio,
      ph.AssetType.image => AssetType.image,
      ph.AssetType.video => AssetType.video,
      ph.AssetType.other => AssetType.other,
    };

DeviceAssetDownloadState _toDownloadState(ph.PMProgressState state) {
  return DeviceAssetDownloadState(
    progress: state.progress,
    status: switch (state.state) {
      ph.PMRequestState.prepare => DeviceAssetRequestStatus.preparing,
      ph.PMRequestState.loading => DeviceAssetRequestStatus.downloading,
      ph.PMRequestState.success => DeviceAssetRequestStatus.success,
      ph.PMRequestState.failed => DeviceAssetRequestStatus.failed,
    },
  );
}
