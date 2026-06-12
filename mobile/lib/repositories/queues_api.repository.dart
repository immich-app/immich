import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/queues/queue_response.model.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/repositories/api.repository.dart';
import 'package:openapi/api.dart';

final queuesApiRepositoryProvider = Provider(
  (ref) => QueuesApiRepository(ref.watch(apiServiceProvider).queuesApi, ref.watch(apiServiceProvider).jobsApi),
);

class QueuesApiRepository extends ApiRepository {
  final QueuesApi _api;
  final JobsApi _jobsApi;

  QueuesApiRepository(this._api, this._jobsApi);

  Future<List<QueueResponse>> getAll() async {
    final response = await checkNull(_api.getQueues());
    return response.map((dto) => QueueResponse.fromDto(dto)).toList();
  }

  Future<QueueResponse> updateQueue(QueueName name, bool isPaused) async {
    final response = await checkNull(_api.updateQueue(name, QueueUpdateDto(isPaused: Optional.present(isPaused))));
    return QueueResponse.fromDto(response);
  }

  Future<QueueResponse> emptyQueue(QueueName name, {bool failed = false}) async {
    await _api.emptyQueue(name, QueueDeleteDto(failed: Optional.present(failed)));
    try {
      final response = await checkNull(_api.getQueue(name));
      return QueueResponse.fromDto(response);
    } catch (e) {
      return QueueResponse(
        name: name.value,
        isPaused: false,
        statistics: const QueueStatistics(active: 0, completed: 0, failed: 0, delayed: 0, waiting: 0, paused: 0),
      );
    }
  }

  Future<QueueResponse> runQueueCommand(QueueName name, QueueCommand command, {bool? force}) async {
    final response = await checkNull(
      _jobsApi.runQueueCommandLegacy(name, QueueCommandDto(command: command, force: Optional.present(force))),
    );
    return QueueResponse.fromLegacyDto(response, name.value);
  }
}
