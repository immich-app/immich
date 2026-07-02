import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/exif.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/infrastructure/utils/exif.converter.dart';
import 'package:openapi/api.dart' as api;

AvatarColor _toAvatarColor(api.UserAvatarColor color) => switch (color) {
  api.UserAvatarColor.red => AvatarColor.red,
  api.UserAvatarColor.green => AvatarColor.green,
  api.UserAvatarColor.blue => AvatarColor.blue,
  api.UserAvatarColor.purple => AvatarColor.purple,
  api.UserAvatarColor.orange => AvatarColor.orange,
  api.UserAvatarColor.pink => AvatarColor.pink,
  api.UserAvatarColor.amber => AvatarColor.amber,
  api.UserAvatarColor.yellow => AvatarColor.yellow,
  api.UserAvatarColor.gray => AvatarColor.gray,
  _ => AvatarColor.primary,
};

extension DTOToAsset on api.AssetResponseDto {
  api.UserResponseDto? get _owner => owner.orElse(null);

  RemoteAsset toDto() {
    return RemoteAsset(
      id: id,
      name: originalFileName,
      checksum: checksum,
      createdAt: fileCreatedAt,
      updatedAt: updatedAt,
      uploadedAt: createdAt,
      ownerId: ownerId,
      ownerName: _owner?.name ?? '',
      ownerAvatarColor: _owner != null ? _toAvatarColor(_owner!.avatarColor) : AvatarColor.primary,
      ownerHasProfileImage: _owner?.profileImagePath.isNotEmpty ?? false,
      ownerProfileChangedAt: _owner?.profileChangedAt,
      visibility: visibility.toAssetVisibility(),
      durationMs: duration,
      height: height?.toInt(),
      width: width?.toInt(),
      isFavorite: isFavorite,
      livePhotoVideoId: livePhotoVideoId.orElse(null),
      thumbHash: thumbhash,
      localId: null,
      type: type.toAssetType(),
      stackId: stack.orElse(null)?.id,
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
      uploadedAt: createdAt,
      ownerId: ownerId,
      ownerName: _owner?.name ?? '',
      ownerAvatarColor: _owner != null ? _toAvatarColor(_owner!.avatarColor) : AvatarColor.primary,
      ownerHasProfileImage: _owner?.profileImagePath.isNotEmpty ?? false,
      ownerProfileChangedAt: _owner?.profileChangedAt,
      visibility: visibility.toAssetVisibility(),
      durationMs: duration,
      height: height?.toInt(),
      width: width?.toInt(),
      isFavorite: isFavorite,
      livePhotoVideoId: livePhotoVideoId.orElse(null),
      thumbHash: thumbhash,
      localId: null,
      type: type.toAssetType(),
      stackId: stack.orElse(null)?.id,
      isEdited: isEdited,
      exifInfo: exifInfo.orElse(null) != null ? ExifDtoConverter.fromDto(exifInfo.orElse(null)!) : const ExifInfo(),
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
