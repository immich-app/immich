// part of 'package:worker_manager/worker_manager.dart';
// ignore_for_file: implementation_imports, avoid_print

import 'dart:async';
import 'dart:math';

import 'package:collection/collection.dart';
import 'package:flutter/foundation.dart';
import 'package:worker_manager/src/number_of_processors/processors_io.dart';
import 'package:worker_manager/src/worker/worker.dart';
import 'package:worker_manager/worker_manager.dart';

final workerManagerPatch = _Executor();

// [-2^54; 2^53] is compatible with dart2js, see core.int doc
const _minId = -9007199254740992;
const _maxId = 9007199254740992;

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
    if (log) print(message);
  }
}

class _Executor extends Mixinable<_Executor> with _ExecutorLogger {
  final _queue = PriorityQueue<Task>();
  final _pool = <Worker>[];
  var _nextTaskId = _minId;
  var _dynamicSpawning = false;
  var _isolatesCount = numberOfProcessors;

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
    for (final worker in _pool) {
      worker.kill();
    }
    _pool.clear();
    super.dispose();
  }

  Cancelable<R> execute<R>(Execute<R> execution, {WorkPriority priority = WorkPriority.immediately}) {
    return _createCancelable<R>(execution: execution, priority: priority);
  }

  Cancelable<R> executeNow<R>(ExecuteGentle<R> execution) {
    final task = TaskGentle<R>(
      id: "",
      workPriority: WorkPriority.immediately,
      execution: execution,
      completer: Completer<R>(),
    );

    Future<void> run() async {
      try {
        final result = await execution(() => task.canceled);
        task.complete(result, null, null);
      } catch (error, st) {
        task.complete(null, error, st);
      }
    }

    run();
    return Cancelable(completer: task.completer, onCancel: () => _cancel(task));
  }

  Cancelable<R> executeWithPort<R, T>(
    ExecuteWithPort<R> execution, {
    WorkPriority priority = WorkPriority.immediately,
    required void Function(T value) onMessage,
  }) {
    return _createCancelable<R>(
      execution: execution,
      priority: priority,
      onMessage: (message) => onMessage(message as T),
    );
  }

  Cancelable<R> executeGentle<R>(ExecuteGentle<R> execution, {WorkPriority priority = WorkPriority.immediately}) {
    return _createCancelable<R>(execution: execution, priority: priority);
  }

  Cancelable<R> executeGentleWithPort<R, T>(
    ExecuteGentleWithPort<R> execution, {
    WorkPriority priority = WorkPriority.immediately,
    required void Function(T value) onMessage,
  }) {
    return _createCancelable<R>(
      execution: execution,
      priority: priority,
      onMessage: (message) => onMessage(message as T),
    );
  }

  void _createWorkers() {
    for (var i = 0; i < _isolatesCount; i++) {
      _pool.add(Worker());
    }
  }

  Future<void> _initializeWorkers() async {
    await Future.wait(_pool.map((e) => e.initialize()));
  }

  Cancelable<R> _createCancelable<R>({
    required Function execution,
    WorkPriority priority = WorkPriority.immediately,
    void Function(Object value)? onMessage,
  }) {
    if (_nextTaskId + 1 == _maxId) {
      _nextTaskId = _minId;
    }
    final id = _nextTaskId.toString();
    _nextTaskId++;
    late final Task<R> task;
    final completer = Completer<R>();
    if (execution is Execute<R>) {
      task = TaskRegular<R>(id: id, workPriority: priority, execution: execution, completer: completer);
    } else if (execution is ExecuteWithPort<R>) {
      task = TaskWithPort<R>(
        id: id,
        workPriority: priority,
        execution: execution,
        completer: completer,
        onMessage: onMessage!,
      );
    } else if (execution is ExecuteGentle<R>) {
      task = TaskGentle<R>(id: id, workPriority: priority, execution: execution, completer: completer);
    } else if (execution is ExecuteGentleWithPort<R>) {
      task = TaskGentleWithPort<R>(
        id: id,
        workPriority: priority,
        execution: execution,
        completer: completer,
        onMessage: onMessage!,
      );
    }
    _queue.add(task);
    _schedule();
    logTaskAdded(task.id);
    return Cancelable(completer: task.completer, onCancel: () => _cancel(task));
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
    if (_dynamicSpawning) {
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
    if (_queue.isEmpty) return;
    final task = _queue.removeFirst();

    availableWorker
        .work(task)
        .then(
          (value) {
            //could be completed already by cancel and it is normal.
            //Assuming that worker finished with error and cleaned gracefully
            task.complete(value, null, null);
          },
          onError: (error, st) {
            task.complete(null, error, st);
          },
        )
        .whenComplete(() {
          if (_dynamicSpawning && _queue.isEmpty) availableWorker.kill();
          _schedule();
        });
  }

  @override
  void _cancel(Task task) {
    task.cancel();
    _queue.remove(task);
    final targetWorker = _pool.firstWhereOrNull((worker) => worker.taskId == task.id);
    if (task is Gentle) {
      targetWorker?.cancelGentle();
    } else {
      targetWorker?.kill();
      if (!_dynamicSpawning) targetWorker?.initialize();
    }
    super._cancel(task);
  }
}
