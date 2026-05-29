// part of 'package:worker_manager/worker_manager.dart';
// ignore_for_file: implementation_imports, avoid_print

import 'dart:async';
import 'dart:math';

import 'package:collection/collection.dart';
import 'package:flutter/foundation.dart';
import 'package:immich_mobile/utils/isolate_worker.dart';
import 'package:worker_manager/src/number_of_processors/processors_io.dart';
import 'package:worker_manager/worker_manager.dart';

final workerManagerPatch = _Executor();

// [-2^54; 2^53] is compatible with dart2js, see core.int doc
const _minId = -9007199254740992;
const _maxId = 9007199254740992;

class _GentleTask<R> extends Task<R> implements Gentle {
  @override
  final GentleExecution<R> execution;

  _GentleTask({required super.id, required super.completer, required super.workPriority, required this.execution});
}

class Mixinable<T> {
  late final itSelf = this as T;
}

mixin _ExecutorLogger on Mixinable<_Executor> {
  var log = false;

  @mustCallSuper
  void init() {
    logMessage("${itSelf._isolatesCount} workers have been spawned and initialized");
  }

  void logTaskAdded<R>(String uid) {
    logMessage("added task with number $uid");
  }

  @mustCallSuper
  void dispose() {
    logMessage("worker_manager have been disposed");
  }

  @mustCallSuper
  void _cancel(Task task) {
    logMessage("Task ${task.id} have been canceled");
  }

  void logMessage(String message) {
    if (log) {
      print(message);
    }
  }
}

class _Executor extends Mixinable<_Executor> with _ExecutorLogger {
  final _queue = PriorityQueue<Task>();
  final _pool = <IsolateWorker>[];
  var _nextTaskId = _minId;
  var _dynamicSpawning = false;
  var _isolatesCount = numberOfProcessors;

  @visibleForTesting
  UnmodifiableListView<IsolateWorker> get pool => UnmodifiableListView(_pool);

  @override
  Future<void> init({int? isolatesCount, bool? dynamicSpawning}) async {
    if (_pool.isNotEmpty) {
      print("worker_manager already warmed up, init is ignored. Dispose before init");
      return;
    }
    if (isolatesCount != null) {
      if (isolatesCount < 0) {
        throw Exception("isolatesCount must be greater than 0");
      }

      _isolatesCount = isolatesCount;
    }
    _dynamicSpawning = dynamicSpawning ?? false;
    await _ensureWorkersInitialized();
    super.init();
  }

  @override
  Future<void> dispose() async {
    _queue.clear();
    final shutdown = _pool.map((worker) => worker.shutdown()).toList(growable: false);
    _pool.clear();
    await Future.wait(shutdown);
    super.dispose();
  }

  /// Runs [execution] on a worker isolate; its [Completer] completes when the
  /// returned [Cancelable] is cancelled.
  Cancelable<R> executeGentle<R>(GentleExecution<R> execution, {WorkPriority priority = WorkPriority.immediately}) {
    if (_nextTaskId + 1 == _maxId) {
      _nextTaskId = _minId;
    }
    final id = _nextTaskId.toString();
    _nextTaskId++;
    final task = _GentleTask<R>(id: id, workPriority: priority, execution: execution, completer: Completer<R>());
    _queue.add(task);
    _schedule();
    logTaskAdded(task.id);
    return Cancelable(completer: task.completer, onCancel: () => _cancel(task));
  }

  void _createWorkers() {
    for (var i = 0; i < _isolatesCount; i++) {
      _pool.add(IsolateWorker());
    }
  }

  Future<void> _initializeWorkers() async {
    await Future.wait(_pool.map((e) => e.initialize()));
  }

  Future<void> _ensureWorkersInitialized() async {
    if (_pool.isEmpty) {
      _createWorkers();
      if (!_dynamicSpawning) {
        await _initializeWorkers();
        final poolSize = _pool.length;
        final queueSize = _queue.length;
        for (int i = 0; i <= min(poolSize, queueSize); i++) {
          _schedule();
        }
      }
    }
    if (_pool.every((worker) => worker.taskId != null)) {
      return;
    }
    if (_dynamicSpawning && _queue.isNotEmpty) {
      final freeWorker = _pool.firstWhereOrNull(
        (worker) => worker.taskId == null && !worker.initialized && !worker.initializing,
      );
      await freeWorker?.initialize();
      _schedule();
    }
  }

  void _schedule() {
    final availableWorker = _pool.firstWhereOrNull((worker) => worker.taskId == null && worker.initialized);
    if (availableWorker == null) {
      _ensureWorkersInitialized();
      return;
    }
    if (_queue.isEmpty) {
      return;
    }
    final task = _queue.removeFirst();

    availableWorker
        .work(task)
        .then(
          (value) {
            //might be completed by cancel and it is normal.
            //Assuming that worker finished with error and cleaned gracefully
            task.complete(value, null, null);
          },
          onError: (error, st) {
            task.complete(null, error, st);
          },
        )
        .whenComplete(() {
          if (_dynamicSpawning && _queue.isEmpty) {
            // Retire the idle worker; shutdown() nulls its fields so the husk
            // stays pooled and is revived by initialize() if work arrives.
            unawaited(availableWorker.shutdown());
          }
          _schedule();
        });
  }

  @override
  void _cancel(Task task) {
    task.cancel();
    _queue.remove(task);
    // All tasks are gentle: signal cancellation; the worker unwinds on its own.
    _pool.firstWhereOrNull((worker) => worker.taskId == task.id)?.cancelGentle();
    super._cancel(task);
  }
}
