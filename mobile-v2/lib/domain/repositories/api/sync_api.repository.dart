import 'package:immich_mobile/domain/interfaces/api/sync_api.interface.dart';
import 'package:immich_mobile/domain/models/asset.model.dart';
import 'package:immich_mobile/utils/extensions/string.extension.dart';
import 'package:immich_mobile/utils/mixins/log.mixin.dart';
import 'package:openapi/api.dart';

class SyncApiRepository with LogMixin implements ISyncApiRepository {
  final SyncApi _syncApi;

  const SyncApiRepository({required SyncApi syncApi}) : _syncApi = syncApi;

  @override
  Future<List<Asset>?> getFullSyncForUser({
    String? lastId,
    required int limit,
    required DateTime updatedUntil,
    String? userId,
  }) async {
    try {
      final res = await _syncApi.getFullSyncForUser(AssetFullSyncDto(
        lastId: lastId,
        limit: limit,
        updatedUntil: updatedUntil,
        userId: userId,
      ));
      return res?.map(_fromAssetResponseDto).toList();
    } catch (e) {
      log.e("Error fetching full asset sync for user", e);
      return null;
    }
  }
}

Asset _fromAssetResponseDto(AssetResponseDto dto) => Asset(
      name: dto.originalFileName,
      hash: dto.checksum,
      height: dto.exifInfo?.exifImageHeight?.toInt(),
      width: dto.exifInfo?.exifImageWidth?.toInt(),
      type: _toAssetType(dto.type),
      createdTime: dto.fileCreatedAt,
      modifiedTime: dto.fileModifiedAt,
      duration: dto.duration.tryParseInt() ?? 0,
      remoteId: dto.id,
      livePhotoVideoId: dto.livePhotoVideoId,
    );

AssetType _toAssetType(AssetTypeEnum type) => switch (type) {
      AssetTypeEnum.AUDIO => AssetType.audio,
      AssetTypeEnum.IMAGE => AssetType.image,
      AssetTypeEnum.VIDEO => AssetType.video,
      _ => AssetType.other,
    };
