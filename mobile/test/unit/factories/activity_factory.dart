import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/models/activities/activity.model.dart';
import 'package:openapi/api.dart';

import '../../utils.dart';
import 'user_factory.dart';

class ActivityFactory {
  const ActivityFactory();

  static Activity create({
    String? id,
    String? assetId,
    String? comment,
    DateTime? createdAt,
    ActivityType type = ActivityType.comment,
    UserDto? user,
    AssetTypeEnum? assetType,
    String? groupId,
  }) {
    return Activity(
      id: TestUtils.uuid(id),
      assetId: assetId,
      comment: comment,
      createdAt: TestUtils.date(createdAt),
      type: type,
      user: user ?? UserFactory.createDto(),
      assetType: assetType,
      groupId: groupId,
    );
  }

  static Activity createAssetAdded({
    String? id,
    String? assetId,
    DateTime? createdAt,
    UserDto? user,
    AssetTypeEnum? assetType = AssetTypeEnum.IMAGE,
    String? groupId,
  }) {
    return create(
      id: id,
      assetId: TestUtils.uuid(assetId),
      createdAt: createdAt,
      type: ActivityType.assetAdded,
      user: user,
      assetType: assetType,
      groupId: groupId,
    );
  }

  static ActivityResponseDto createDto({
    String? id,
    String? assetId,
    DateTime? createdAt,
    ReactionType type = ReactionType.comment,
    UserResponseDto? user,
    String? comment,
    AssetTypeEnum? assetType,
    String? groupId,
  }) {
    return ActivityResponseDto(
      id: TestUtils.uuid(id),
      assetId: assetId,
      createdAt: TestUtils.date(createdAt),
      type: type,
      user: user ?? createUserResponseDto(),
      comment: comment == null ? const Optional.absent() : Optional.present(comment),
      assetType: assetType == null ? const Optional.absent() : Optional.present(assetType),
      groupId: groupId == null ? const Optional.absent() : Optional.present(groupId),
    );
  }

  static UserResponseDto createUserResponseDto({String? id, String? name}) {
    final userId = TestUtils.uuid(id);
    return UserResponseDto(
      avatarColor: UserAvatarColor.primary,
      email: '$userId@immich.app',
      id: userId,
      name: name ?? 'user_$userId',
      profileChangedAt: TestUtils.date(null),
      profileImagePath: '',
    );
  }
}
