import 'package:http/http.dart' as http;
import 'package:immich_mobile/domain/models/sync_event.model.dart';

abstract interface class ISyncApiRepository {
  Future<void> ack(List<String> data);

  Future<void> streamChanges(
    Function(List<SyncEvent>, Function() abort) onData, {
    int batchSize,
    http.Client? httpClient,
  });
}
