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
    data: SyncPartnerV1(
      inTimeline: true,
      sharedById: "1",
      sharedWithId: "2",
    ),
    ack: "3",
  );
  static final partnerDeleteV1 = SyncEvent(
    type: SyncEntityType.partnerDeleteV1,
    data: SyncPartnerDeleteV1(sharedById: "3", sharedWithId: "4"),
    ack: "4",
  );
}
