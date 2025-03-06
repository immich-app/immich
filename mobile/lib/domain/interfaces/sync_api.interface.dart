import 'package:immich_mobile/domain/models/sync/sync_event.model.dart';

abstract interface class ISyncApiRepository {
  Future<void> ack(String data);

  Stream<List<SyncEvent>> watchUserSyncEvent();
}
