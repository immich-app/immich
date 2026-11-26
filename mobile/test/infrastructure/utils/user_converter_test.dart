import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/infrastructure/utils/user.converter.dart';
import 'package:openapi/api.dart';

void main() {
  final changedAt = DateTime.utc(2026);

  test('fromSimpleUserDto stores a null name and profile image as empty', () {
    final user = UserConverter.fromSimpleUserDto(
      UserResponseDto(
        avatarColor: UserAvatarColor.primary,
        email: 'user@immich.app',
        id: 'user1',
        name: null,
        profileChangedAt: changedAt,
        profileImagePath: null,
      ),
    );

    expect(user.name, '');
    expect(user.hasProfileImage, isFalse);
  });

  test('fromAdminDto stores a null name and profile image as empty', () {
    final user = UserConverter.fromAdminDto(
      UserAdminResponseDto(
        avatarColor: UserAvatarColor.primary,
        clusterGroupId: 'group1',
        createdAt: changedAt,
        deletedAt: null,
        email: 'user@immich.app',
        id: 'user1',
        isAdmin: false,
        license: null,
        name: null,
        oauthId: null,
        profileChangedAt: changedAt,
        profileImagePath: null,
        quotaSizeInBytes: null,
        quotaUsageInBytes: null,
        shouldChangePassword: false,
        status: UserStatus.active,
        storageLabel: null,
        updatedAt: changedAt,
      ),
    );

    expect(user.name, '');
    expect(user.hasProfileImage, isFalse);
  });

  test('fromPartnerDto stores a null name and profile image as empty', () {
    final user = UserConverter.fromPartnerDto(
      PartnerResponseDto(
        avatarColor: UserAvatarColor.primary,
        email: 'user@immich.app',
        id: 'user1',
        name: null,
        profileChangedAt: changedAt,
        profileImagePath: null,
      ),
    );

    expect(user.name, '');
    expect(user.hasProfileImage, isFalse);
  });
}
