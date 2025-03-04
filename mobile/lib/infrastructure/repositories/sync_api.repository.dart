import 'dart:async';

import 'package:immich_mobile/domain/interfaces/sync_api.interface.dart';
import 'package:immich_mobile/domain/models/sync/sync_event.model.dart';
import 'package:immich_mobile/extensions/sync_api_extensions.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:openapi/api.dart';

class SyncApiRepository extends IsarDatabaseRepository
    implements ISyncApiRepository {
  final ApiService _api;
  const SyncApiRepository(super.db, this._api);

  @override
  Stream<List<SyncEvent>> watchUserSyncEvent() {
    return _api.getSyncStream(
      SyncStreamDto(types: [SyncRequestType.usersV1]),
      batchSize: 1000,
    );
  }

  @override
  Future<void> ack(String data) {
    return _api.syncApi.sendSyncAck(SyncAckSetDto(acks: [data]));
  }
}
