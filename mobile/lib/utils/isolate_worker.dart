// Forked from worker_manager's `WorkerImpl` (src/worker/worker_io.dart): a
// `CancelRequest` completes the computation's [Completer] (so it can await
// cancellation and unwind) instead of flipping a polled flag, and [shutdown]
// lets the isolate drain and exit on its own rather than force-killing it. Only
// the gentle-with-cancellation path immich uses is kept.
//
// ignore_for_file: implementation_imports

import 'dart:async';
import 'dart:isolate';

import 'package:worker_manager/src/scheduling/task.dart';
import 'package:worker_manager/src/worker/cancel_request.dart';
import 'package:worker_manager/src/worker/result.dart';

/// A worker computation that receives a [Completer] which completes on
/// cancellation: await its future to react promptly, or read `isCompleted`.
typedef GentleExecution<R> = FutureOr<R> Function(Completer<void> onCancel);

class _Shutdown {
  const _Shutdown();
}

class IsolateWorker {
  IsolateWorker();

  Isolate? _isolate;
  RawReceivePort? _receivePort;
  SendPort? _sendPort;
  Completer<void>? _sendPortReceived;
  Completer? _result;

  String? taskId;

  bool get initialized => _sendPortReceived?.isCompleted ?? false;

  bool get initializing {
    final sendPortReceived = _sendPortReceived;
    return sendPortReceived != null && !sendPortReceived.isCompleted;
  }

  Future<void> initialize() async {
    final sendPortReceived = _sendPortReceived = Completer<void>();
    final receivePort = _receivePort = RawReceivePort();
    receivePort.handler = (Object message) {
      if (message is SendPort) {
        _sendPort = message;
        sendPortReceived.complete();
      } else if (message is ResultSuccess) {
        _result?.complete(message.value);
        _afterTask();
      } else if (message is ResultError) {
        _result?.completeError(message.error, message.stackTrace);
        _afterTask();
      }
    };
    _isolate = await Isolate.spawn(_isolateEntry, receivePort.sendPort, errorsAreFatal: false);
    await sendPortReceived.future;
  }

  Future<R> work<R>(Task<R> task) async {
    taskId = task.id;
    final result = _result = Completer();
    _sendPort!.send(task.execution);
    return await (result.future as Future<R>);
  }

  /// Cancels the current task without retiring the worker.
  void cancelGentle() => _sendPort?.send(CancelRequest());

  /// Cancels any in-flight task and awaits the isolate exiting on its own — no
  /// force-kill, so `finally` blocks and native cleanup always run.
  ///
  /// Detaches the slot up front so a concurrent [initialize] can revive it
  /// without colliding (revival installs fresh ports while this drains the ones
  /// it captured locally). A revived worker is always idle, so the still-live
  /// receive-port handler can't misroute a result.
  Future<void> shutdown() async {
    final sendPortReceived = _sendPortReceived;
    if (sendPortReceived != null && !sendPortReceived.isCompleted) {
      await sendPortReceived.future;
    }

    final isolate = _isolate;
    final receivePort = _receivePort;
    final sendPort = _sendPort;
    if (isolate == null || receivePort == null || sendPort == null) {
      return;
    }
    _isolate = null;
    _sendPort = null;
    _sendPortReceived = null;
    // Not _result: an in-flight task still delivers it before exiting; nulling
    // here would drop that and hang work()'s caller.

    final exited = Completer<void>();
    final exitPort = RawReceivePort();
    exitPort.handler = (_) {
      if (!exited.isCompleted) {
        exited.complete();
      }
      exitPort.close();
    };
    isolate.addOnExitListener(exitPort.sendPort);
    sendPort.send(const _Shutdown());
    await exited.future;
    receivePort.close();
  }

  void _afterTask() {
    taskId = null;
    _result = null;
  }

  static void _isolateEntry(SendPort sendPort) {
    final receivePort = RawReceivePort();
    sendPort.send(receivePort.sendPort);
    // One task at a time, so a single completer suffices; null between tasks.
    Completer<void>? onCancel;
    void cancel() {
      if (onCancel?.isCompleted == false) {
        onCancel!.complete();
      }
    }

    var shuttingDown = false;
    var running = false;
    receivePort.handler = (message) async {
      if (message is _Shutdown) {
        shuttingDown = true;
        cancel();
        if (!running) {
          Isolate.exit();
        }
        return;
      }
      if (message is CancelRequest) {
        cancel();
        return;
      }
      final execution = message as GentleExecution;
      onCancel = Completer<void>();
      running = true;
      Result result;
      try {
        result = ResultSuccess(await execution(onCancel!));
      } catch (error, stackTrace) {
        result = ResultError(error, stackTrace);
      } finally {
        onCancel = null;
        running = false;
      }
      if (shuttingDown) {
        // An isolate that has used platform channels can't exit on its own (Flutter's BackgroundIsolateBinaryMessenger
        // opens an undisposable port), so closing our ports isn't enough. Isolate.exit delivers the result as its final
        // message and terminates. It's abrupt (skips pending finally/microtasks) but safe here: the computation and its
        // `finally` are already done and there's no await before this, so nothing pending is skipped.
        Isolate.exit(sendPort, result);
      }
      sendPort.send(result);
    };
  }
}
