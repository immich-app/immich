import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/exif.model.dart';
import 'package:immich_mobile/entities/asset.entity.dart' as isar hide AssetTypeEnumHelper;
import 'package:immich_mobile/extensions/string_extensions.dart';
import 'package:immich_mobile/infrastructure/utils/exif.converter.dart';
import 'package:immich_mobile/utils/timezone.dart';
import 'package:openapi/api.dart' as api;

extension TZExtension on isar.Asset {
  /// Returns the created time of the asset from the exif info (if available) or from
  /// the fileCreatedAt field, adjusted to the timezone value from the exif info along with
  /// the timezone offset in [Duration]
  (DateTime, Duration) getTZAdjustedTimeAndOffset() {
    DateTime dt = fileCreatedAt.toLocal();

    if (exifInfo?.dateTimeOriginal != null) {
      return applyTimezoneOffset(dateTime: exifInfo!.dateTimeOriginal!, timeZone: exifInfo?.timeZone);
    }

    return (dt, dt.timeZoneOffset);
  }
}

extension DTOToAsset on api.AssetResponseDto {
  RemoteAsset toDto() {
    return RemoteAsset(
      id: id,
      name: originalFileName,
      checksum: checksum,
      createdAt: fileCreatedAt,
      updatedAt: updatedAt,
      ownerId: ownerId,
      visibility: visibility.toAssetVisibility(),
      durationInSeconds: duration.toDuration()?.inSeconds ?? 0,
      height: height?.toInt(),
      width: width?.toInt(),
      isFavorite: isFavorite,
      livePhotoVideoId: livePhotoVideoId,
      thumbHash: thumbhash,
      localId: null,
      type: type.toAssetType(),
      stackId: stack?.id,
      isEdited: isEdited,
    );
  }

  RemoteAssetExif toDtoWithExif() {
    return RemoteAssetExif(
      id: id,
      name: originalFileName,
      checksum: checksum,
      createdAt: fileCreatedAt,
      updatedAt: updatedAt,
      ownerId: ownerId,
      visibility: visibility.toAssetVisibility(),
      durationInSeconds: duration.toDuration()?.inSeconds ?? 0,
      height: height?.toInt(),
      width: width?.toInt(),
      isFavorite: isFavorite,
      livePhotoVideoId: livePhotoVideoId,
      thumbHash: thumbhash,
      localId: null,
      type: type.toAssetType(),
      stackId: stack?.id,
      isEdited: isEdited,
      exifInfo: exifInfo != null ? ExifDtoConverter.fromDto(exifInfo!) : const ExifInfo(),
    );
  }
}

extension on api.AssetVisibility {
  AssetVisibility toAssetVisibility() => switch (this) {
    api.AssetVisibility.timeline => AssetVisibility.timeline,
    api.AssetVisibility.hidden => AssetVisibility.hidden,
    api.AssetVisibility.archive => AssetVisibility.archive,
    api.AssetVisibility.locked => AssetVisibility.locked,
    _ => AssetVisibility.timeline,
  };
}

extension on api.AssetTypeEnum {
  AssetType toAssetType() => switch (this) {
    api.AssetTypeEnum.IMAGE => AssetType.image,
    api.AssetTypeEnum.VIDEO => AssetType.video,
    api.AssetTypeEnum.AUDIO => AssetType.audio,
    api.AssetTypeEnum.OTHER => AssetType.other,
    _ => throw Exception('Unknown AssetType value: $this'),
  };
}
