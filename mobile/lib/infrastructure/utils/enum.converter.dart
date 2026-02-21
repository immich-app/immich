import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart' show AssetType;
import 'package:openapi/api.dart';

// Asset type converter

AssetType _toAssetTypeFromApiValue(String v) => switch (v) {
  'IMAGE' => AssetType.image,
  'VIDEO' => AssetType.video,
  'AUDIO' => AssetType.audio,
  'OTHER' => AssetType.other,
  _ => AssetType.other,
};

// Avatar color converter

AvatarColor _toAvatarColorFromApiValue(String v) =>
    AvatarColor.values.firstWhere((c) => c.value == v, orElse: () => AvatarColor.primary);


// Optional: if you still want to canonicalize via the shared model
UserAvatarColor _toUserAvatarColorFromApiValue(String v) => UserAvatarColor.fromJson(v) ?? UserAvatarColor.primary;

extension UserResponseDtoAvatarColorEnumX on UserResponseDtoAvatarColorEnum {
  AvatarColor toAvatarColor() => _toAvatarColorFromApiValue(value);
  UserAvatarColor toUserAvatarColor() => _toUserAvatarColorFromApiValue(value);
}

extension UserAdminResponseDtoAvatarColorEnumX on UserAdminResponseDtoAvatarColorEnum {
  AvatarColor toAvatarColor() => _toAvatarColorFromApiValue(value);
  UserAvatarColor toUserAvatarColor() => _toUserAvatarColorFromApiValue(value);
}

extension PartnerResponseDtoAvatarColorEnumX on PartnerResponseDtoAvatarColorEnum {
  AvatarColor toAvatarColor() => _toAvatarColorFromApiValue(value);
  UserAvatarColor toUserAvatarColor() => _toUserAvatarColorFromApiValue(value);
}

extension UserUpdateMeDtoAvatarColorEnumX on UserUpdateMeDtoAvatarColorEnum {
  AvatarColor toAvatarColor() => _toAvatarColorFromApiValue(value);
  UserAvatarColor toUserAvatarColor() => _toUserAvatarColorFromApiValue(value);
}

extension AssetResponseDtoTypeEnumX on AssetResponseDtoTypeEnum {
  AssetType toAssetType() => _toAssetTypeFromApiValue(value);
}

AssetVisibility _toApiAssetVisibilityFromValue(String v) =>
    AssetVisibility.fromJson(v) ?? AssetVisibility.timeline;

extension AssetResponseDtoVisibilityEnumX on AssetResponseDtoVisibilityEnum {
  AssetVisibility toAssetVisibility() => _toApiAssetVisibilityFromValue(value);
}