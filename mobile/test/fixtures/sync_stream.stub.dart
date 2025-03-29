import 'package:immich_mobile/domain/models/sync_event.model.dart';
import 'package:openapi/api.dart';

abstract final class SyncStreamStub {
  static final userV1Admin = SyncUserV1(
    deletedAt: DateTime(2020),
    email: "admin@admin",
    id: "1",
    name: "Admin",
  );
  static final userV1User = SyncUserV1(
    deletedAt: DateTime(2021),
    email: "user@user",
    id: "2",
    name: "User",
  );
  static final userDeleteV1 = SyncUserDeleteV1(userId: "2");
  static final userEvents = [
    SyncEvent(type: SyncEntityType.userV1, data: userV1Admin, ack: "1"),
    SyncEvent(
      type: SyncEntityType.userDeleteV1,
      data: userDeleteV1,
      ack: "2",
    ),
    SyncEvent(type: SyncEntityType.userV1, data: userV1User, ack: "5"),
  ];

  static final partnerV1 = SyncPartnerV1(
    inTimeline: true,
    sharedById: "1",
    sharedWithId: "2",
  );
  static final partnerDeleteV1 = SyncPartnerDeleteV1(
    sharedById: "3",
    sharedWithId: "4",
  );
  static final partnerEvents = [
    SyncEvent(type: SyncEntityType.partnerV1, data: partnerV1, ack: "3"),
    SyncEvent(
      type: SyncEntityType.partnerDeleteV1,
      data: partnerDeleteV1,
      ack: "4",
    ),
  ];
}
