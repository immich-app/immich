import 'package:openapi/api.dart';

abstract final class SharedSpaceMemberStub {
  const SharedSpaceMemberStub._();

  static final owner = SharedSpaceMemberResponseDto(
    userId: 'user-1',
    name: 'Alice',
    email: 'alice@example.com',
    role: SharedSpaceMemberResponseDtoRoleEnum.owner,
    joinedAt: '2024-01-01T00:00:00Z',
    showInTimeline: true,
    avatarColor: 'green',
    contributionCount: 42,
    profileChangedAt: '2024-01-01T00:00:00Z',
  );

  static final editor = SharedSpaceMemberResponseDto(
    userId: 'user-2',
    name: 'Bob',
    email: 'bob@example.com',
    role: SharedSpaceMemberResponseDtoRoleEnum.editor,
    joinedAt: '2024-02-01T00:00:00Z',
    showInTimeline: true,
    avatarColor: 'red',
    contributionCount: 15,
    profileChangedAt: '2024-02-01T00:00:00Z',
  );

  static final viewer = SharedSpaceMemberResponseDto(
    userId: 'user-3',
    name: 'Charlie',
    email: 'charlie@example.com',
    role: SharedSpaceMemberResponseDtoRoleEnum.viewer,
    joinedAt: '2024-03-01T00:00:00Z',
    showInTimeline: false,
    avatarColor: 'blue',
    contributionCount: 0,
    profileChangedAt: '2024-03-01T00:00:00Z',
  );
}

abstract final class SharedSpaceStub {
  const SharedSpaceStub._();

  static final space1 = SharedSpaceResponseDto(
    id: 'space-1',
    name: 'Family Photos',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
    createdById: 'user-1',
    description: 'Shared family photo collection',
    color: SharedSpaceResponseDtoColorEnum.blue,
    assetCount: 150,
    memberCount: 3,
    faceRecognitionEnabled: true,
  );

  static final space2 = SharedSpaceResponseDto(
    id: 'space-2',
    name: 'Travel 2024',
    createdAt: '2024-06-01T00:00:00Z',
    updatedAt: '2024-06-10T00:00:00Z',
    createdById: 'user-2',
    color: SharedSpaceResponseDtoColorEnum.green,
    assetCount: 42,
    memberCount: 2,
    faceRecognitionEnabled: false,
  );

  static final spaceWithMembers = SharedSpaceResponseDto(
    id: 'space-3',
    name: 'Team Project',
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-03-20T00:00:00Z',
    createdById: 'user-1',
    description: 'Team collaboration space',
    color: SharedSpaceResponseDtoColorEnum.purple,
    assetCount: 300,
    memberCount: 3,
    members: [SharedSpaceMemberStub.owner, SharedSpaceMemberStub.editor, SharedSpaceMemberStub.viewer],
    faceRecognitionEnabled: true,
    thumbnailAssetId: 'asset-thumbnail-1',
    thumbnailCropY: 50,
    lastActivityAt: '2024-03-20T12:00:00Z',
    lastContributor: SharedSpaceResponseDtoLastContributor(id: 'user-2', name: 'Bob'),
    recentAssetIds: ['asset-1', 'asset-2', 'asset-3', 'asset-4'],
    recentAssetThumbhashes: ['hash-1', 'hash-2', 'hash-3', 'hash-4'],
    newAssetCount: 5,
  );

  static final emptySpace = SharedSpaceResponseDto(
    id: 'space-empty',
    name: 'Empty Space',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdById: 'user-1',
    assetCount: 0,
    memberCount: 1,
  );
}
