import 'dart:async';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/utils/debug_print.dart';
import 'package:immich_mobile/models/queues/queue_response.model.dart';
import 'package:immich_mobile/repositories/queues_api.repository.dart';
import 'package:openapi/api.dart';

final queuesProvider = StateNotifierProvider<QueuesNotifier, List<QueueResponse>>((ref) {
  final repository = ref.watch(queuesApiRepositoryProvider);
  return QueuesNotifier(repository);
});

final queueByNameProvider = Provider.family<QueueResponse?, String>((ref, name) {
  final queues = ref.watch(queuesProvider);
  for (final queue in queues) {
    if (queue.name == name) {
      return queue;
    }
  }
  return null;
});

class QueuesNotifier extends StateNotifier<List<QueueResponse>> {
  QueuesNotifier(this._repository) : super([]) {
    _refresh();
    _timer = Timer.periodic(const Duration(seconds: 3), (_) => _refresh());
  }

  final QueuesApiRepository _repository;
  Timer? _timer;
  bool _disposed = false;

  Future<void> _refresh() async {
    if (_disposed) {
      return;
    }

    try {
      final queues = await _repository.getAll();
      if (!_disposed) {
        state = queues;
      }
    } catch (e) {
      dPrint(() => 'QueuesNotifier error: $e');
    }
  }

  Future<void> pauseQueue(QueueName name) async {
    try {
      final queue = await _repository.updateQueue(name, true);
      _updateQueueInState(queue);
    } catch (e) {
      dPrint(() => 'pauseQueue error: $e');
    }
  }

  Future<void> resumeQueue(QueueName name) async {
    try {
      final queue = await _repository.updateQueue(name, false);
      _updateQueueInState(queue);
    } catch (e) {
      dPrint(() => 'resumeQueue error: $e');
    }
  }

  Future<void> emptyQueue(QueueName name, {bool failed = false}) async {
    try {
      final queue = await _repository.emptyQueue(name, failed: failed);
      _updateQueueInState(queue);
    } catch (e) {
      dPrint(() => 'emptyQueue error: $e');
    }
  }

  Future<void> runCommand(QueueName name, QueueCommand command, {bool? force}) async {
    try {
      final queue = await _repository.runQueueCommand(name, command, force: force);
      _updateQueueInState(queue);
    } catch (e) {
      dPrint(() => 'runCommand error: $e');
    }
  }

  void _updateQueueInState(QueueResponse updatedQueue) {
    final index = state.indexWhere((q) => q.name == updatedQueue.name);
    if (index >= 0) {
      final newState = List<QueueResponse>.from(state);
      newState[index] = updatedQueue;
      state = newState;
    }
  }

  @override
  void dispose() {
    _disposed = true;
    _timer?.cancel();
    super.dispose();
  }
}
