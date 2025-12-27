import 'package:immich_mobile/domain/models/sync_event.model.dart';
import 'package:openapi/api.dart';

abstract final class SyncStreamStub {
  static final userV1Admin = SyncEvent(
    type: SyncEntityType.userV1,
    data: SyncUserV1(
      deletedAt: DateTime(2020),
      email: "admin@admin",
      id: "1",
      name: "Admin",
      avatarColor: null,
      hasProfileImage: false,
      profileChangedAt: DateTime(2025),
    ),
    ack: "1",
  );
  static final userV1User = SyncEvent(
    type: SyncEntityType.userV1,
    data: SyncUserV1(
      deletedAt: DateTime(2021),
      email: "user@user",
      id: "5",
      name: "User",
      avatarColor: null,
      hasProfileImage: false,
      profileChangedAt: DateTime(2025),
    ),
    ack: "5",
  );
  static final userDeleteV1 = SyncEvent(
    type: SyncEntityType.userDeleteV1,
    data: SyncUserDeleteV1(userId: "2"),
    ack: "2",
  );

  static final partnerV1 = SyncEvent(
    type: SyncEntityType.partnerV1,
    data: SyncPartnerV1(inTimeline: true, sharedById: "1", sharedWithId: "2"),
    ack: "3",
  );
  static final partnerDeleteV1 = SyncEvent(
    type: SyncEntityType.partnerDeleteV1,
    data: SyncPartnerDeleteV1(sharedById: "3", sharedWithId: "4"),
    ack: "4",
  );

  static final memoryV1 = SyncEvent(
    type: SyncEntityType.memoryV1,
    data: SyncMemoryV1(
      createdAt: DateTime(2023, 1, 1),
      data: {"year": 2023, "title": "Test Memory"},
      deletedAt: null,
      hideAt: null,
      id: "memory-1",
      isSaved: false,
      memoryAt: DateTime(2023, 1, 1),
      ownerId: "user-1",
      seenAt: null,
      showAt: DateTime(2023, 1, 1),
      type: MemoryType.onThisDay,
      updatedAt: DateTime(2023, 1, 1),
    ),
    ack: "5",
  );

  static final memoryDeleteV1 = SyncEvent(
    type: SyncEntityType.memoryDeleteV1,
    data: SyncMemoryDeleteV1(memoryId: "memory-2"),
    ack: "6",
  );

  static final memoryToAssetV1 = SyncEvent(
    type: SyncEntityType.memoryToAssetV1,
    data: SyncMemoryAssetV1(assetId: "asset-1", memoryId: "memory-1"),
    ack: "7",
  );

  static final memoryToAssetDeleteV1 = SyncEvent(
    type: SyncEntityType.memoryToAssetDeleteV1,
    data: SyncMemoryAssetDeleteV1(assetId: "asset-2", memoryId: "memory-1"),
    ack: "8",
  );

  static final assetDeleteV1 = SyncEvent(
    type: SyncEntityType.assetDeleteV1,
    data: SyncAssetDeleteV1(assetId: "remote-asset"),
    ack: "asset-delete-ack",
  );

  static SyncEvent assetTrashed({
    required String id,
    required String checksum,
    required String ack,
    DateTime? trashedAt,
  }) {
    return _assetV1(id: id, checksum: checksum, deletedAt: trashedAt ?? DateTime(2025, 1, 1), ack: ack);
  }

  static SyncEvent assetModified({required String id, required String checksum, required String ack}) {
    return _assetV1(id: id, checksum: checksum, deletedAt: null, ack: ack);
  }

  static SyncEvent _assetV1({
    required String id,
    required String checksum,
    required DateTime? deletedAt,
    required String ack,
  }) {
    return SyncEvent(
      type: SyncEntityType.assetV1,
      data: SyncAssetV1(
        checksum: checksum,
        deletedAt: deletedAt,
        duration: '0',
        fileCreatedAt: DateTime(2025),
        fileModifiedAt: DateTime(2025, 1, 2),
        id: id,
        isFavorite: false,
        libraryId: null,
        livePhotoVideoId: null,
        localDateTime: DateTime(2025, 1, 3),
        originalFileName: '$id.jpg',
        ownerId: 'owner',
        stackId: null,
        thumbhash: null,
        type: AssetTypeEnum.IMAGE,
        visibility: AssetVisibility.timeline,
        width: null,
        height: null,
      ),
      ack: ack,
    );
  }
}
