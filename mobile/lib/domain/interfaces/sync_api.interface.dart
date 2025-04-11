import 'package:immich_mobile/domain/models/sync/sync_event.model.dart';

abstract interface class ISyncApiRepository {
  Future<void> ack(List<String> data);

  Stream<List<SyncEvent>> watchUserSyncEvent();

  Stream<List<SyncEvent>> watchAssetSyncEvent();

  Stream<List<SyncEvent>> watchExifSyncEvent();
}
