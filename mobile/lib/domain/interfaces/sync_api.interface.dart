import 'package:immich_mobile/domain/models/sync_event.model.dart';
import 'package:openapi/api.dart';

abstract interface class ISyncApiRepository {
  Future<void> ack(List<String> data);

  Stream<List<SyncEvent>> getSyncEvents(List<SyncRequestType> type);
}
