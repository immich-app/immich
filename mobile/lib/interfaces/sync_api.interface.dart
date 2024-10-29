import 'package:immich_mobile/models/sync/sync_event.model.dart';
import 'package:openapi/api.dart';

abstract interface class ISyncApiRepository {
  Stream<List<SyncEvent>> getChanges(SyncStreamDtoTypesEnum type);

  Future<void> confirmChanges(
    SyncStreamDtoTypesEnum type,
    String id,
    String timestamp,
  );
}
