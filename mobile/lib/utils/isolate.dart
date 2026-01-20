import 'dart:async';
import 'dart:isolate';
import 'dart:ui';

import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/log.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/logger_db.repository.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:immich_mobile/providers/infrastructure/cancel.provider.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/utils/bootstrap.dart';
import 'package:immich_mobile/utils/debug_print.dart';
import 'package:immich_mobile/utils/http_ssl_options.dart';
import 'package:isar/isar.dart';
import 'package:logging/logging.dart';

class CancellableTask<T> {
  final Future<T?> future;
  final void Function() cancel;

  const CancellableTask({required this.future, required this.cancel});

  CancellableTask<T> whenComplete(void Function() action) {
    return CancellableTask(future: future.whenComplete(action), cancel: cancel);
  }

  CancellableTask<T> catchError(Function onError) {
    return CancellableTask(future: future.catchError(onError), cancel: cancel);
  }

  CancellableTask<R> then<R>(FutureOr<R> Function(T?) onValue) {
    return CancellableTask(future: future.then(onValue), cancel: cancel);
  }
}

sealed class _IsolateMessage {
  const _IsolateMessage();
}

class _InitMessage extends _IsolateMessage {
  final SendPort sendPort;
  const _InitMessage(this.sendPort);
}

class _CancelMessage extends _IsolateMessage {
  const _CancelMessage();
}

class _ResultMessage extends _IsolateMessage {
  final dynamic data;
  const _ResultMessage(this.data);
}

class _ErrorMessage extends _IsolateMessage {
  final Object? error;
  final StackTrace? stackTrace;
  const _ErrorMessage(this.error, [this.stackTrace]);
}

class _DoneMessage extends _IsolateMessage {
  const _DoneMessage();
}

class _IsolateTaskConfig<T> {
  final Future<T> Function(ProviderContainer ref) computation;
  final SendPort mainSendPort;
  final RootIsolateToken rootToken;
  final String debugLabel;

  const _IsolateTaskConfig({
    required this.computation,
    required this.mainSendPort,
    required this.rootToken,
    required this.debugLabel,
  });
}

class _IsolateTaskRunner<T> {
  final Completer<T?> _completer = Completer<T?>();
  final ReceivePort _receivePort = ReceivePort();
  final String debugLabel;

  Isolate? _isolate;
  SendPort? _isolateSendPort;
  bool _isCancelled = false;
  bool _isCleanedUp = false;
  Timer? _cleanupTimeoutTimer;

  _IsolateTaskRunner({required this.debugLabel});

  Future<void> start(Future<T> Function(ProviderContainer ref) computation) async {
    final token = RootIsolateToken.instance;
    if (token == null) {
      _completer.completeError(Exception("RootIsolateToken is not available. Isolate cannot be started."));
      return;
    }

    _receivePort.listen(_handleMessage);

    final config = _IsolateTaskConfig<T>(
      computation: computation,
      mainSendPort: _receivePort.sendPort,
      rootToken: token,
      debugLabel: debugLabel,
    );

    try {
      _isolate = await Isolate.spawn(_isolateEntryPoint<T>, config, debugName: debugLabel);
    } catch (error, stack) {
      _completer.completeError(error, stack);
      _cleanup();
    }
  }

  void cancel() {
    if (_isCancelled || _isCleanedUp) return;

    _isCancelled = true;
    dPrint(() => "[$debugLabel] Cancellation requested");

    _isolateSendPort?.send(const _CancelMessage());
    _cleanupTimeoutTimer = Timer(const Duration(seconds: 4), () {
      if (!_isCleanedUp) {
        dPrint(() => "[$debugLabel] Cleanup timeout - force killing isolate");
        _isolate?.kill(priority: Isolate.immediate);
        if (!_completer.isCompleted) {
          _completer.completeError(Exception("Isolate cleanup timed out for task: $debugLabel"));
        }
        _cleanup();
      }
    });
  }

  void _handleMessage(dynamic message) {
    if (message is! _IsolateMessage) return;

    switch (message) {
      case _InitMessage(:var sendPort):
        _isolateSendPort = sendPort;
        dPrint(() => "[$debugLabel] Isolate initialized");
        break;

      case _ResultMessage(:var data):
        if (!_completer.isCompleted) {
          _completer.complete(data as T?);
          dPrint(() => "[$debugLabel] Isolate task completed with result - $data");
        }
        _cleanup();
        break;

      case _ErrorMessage(:var error, :var stackTrace):
        if (!_completer.isCompleted) {
          dPrint(() => "[$debugLabel] Isolate task completed with error - $error");
          _completer.completeError(error ?? Exception("Unknown error in isolate"), stackTrace ?? StackTrace.current);
        }
        _cleanup();
        break;

      case _DoneMessage():
        dPrint(() => "[$debugLabel] Isolate cleanup completed");
        _cleanup();
        break;

      case _CancelMessage():
        // Not expected to receive cancel from isolate
        break;
    }
  }

  void _cleanup() {
    if (_isCleanedUp) return;
    if (!_completer.isCompleted) {
      _completer.completeError(Exception("Isolate task cleaned up without completing."));
    }
    _isCleanedUp = true;

    _cleanupTimeoutTimer?.cancel();
    _receivePort.close();
    _isolate?.kill(priority: Isolate.beforeNextEvent);
    _isolate = null;
    _isolateSendPort = null;

    dPrint(() => "[$debugLabel] Isolate cleaned up");
  }

  Future<T?> get future => _completer.future;
}

Future<void> _cleanupResources<T>(ProviderContainer? ref, Isar isar, Drift drift, DriftLogger logDb) async {
  try {
    final cleanupFutures = <Future>[
      Store.dispose(),
      LogService.I.dispose(),
      logDb.close(),
      drift.close(),
      if (isar.isOpen) isar.close().catchError((_) => false),
    ];

    ref?.dispose();

    await Future.wait(cleanupFutures).timeout(
      const Duration(seconds: 2),
      onTimeout: () {
        dPrint(() => "Cleanup timeout - some resources may not be closed");
        return [];
      },
    );
  } catch (error, stack) {
    dPrint(() => "Error during isolate cleanup: $error with stack: $stack");
  }
}

Future<void> _isolateEntryPoint<T>(_IsolateTaskConfig<T> config) async {
  final receivePort = ReceivePort();
  config.mainSendPort.send(_InitMessage(receivePort.sendPort));

  bool isCancelled = false;
  ProviderContainer? ref;
  final Isar isar;
  final Drift drift;
  final DriftLogger logDb;

  try {
    BackgroundIsolateBinaryMessenger.ensureInitialized(config.rootToken);
    DartPluginRegistrant.ensureInitialized();
    final (bootIsar, bootDrift, bootLogDb) = await Bootstrap.initDB();
    await Bootstrap.initDomain(bootIsar, bootDrift, bootLogDb, shouldBufferLogs: false, listenStoreUpdates: false);
    isar = bootIsar;
    drift = bootDrift;
    logDb = bootLogDb;
  } catch (error, stack) {
    dPrint(() => "[$config.debugLabel] Error during isolate bootstrap: $error");
    config.mainSendPort.send(_ErrorMessage(error, stack));
    return;
  }

  final subscription = receivePort.listen((message) async {
    if (message is _CancelMessage) {
      isCancelled = true;
      try {
        receivePort.close();
        await _cleanupResources(ref, isar, drift, logDb);
      } catch (error, stack) {
        dPrint(() => "Error during isolate cancellation cleanup: $error with stack: $stack");
      } finally {
        config.mainSendPort.send(const _ErrorMessage("Isolate task cancelled"));
      }
    }
  });

  final log = Logger("IsolateWorker[${config.debugLabel}]");
  await runZonedGuarded(
    () async {
      try {
        ref = ProviderContainer(
          overrides: [
            dbProvider.overrideWithValue(isar),
            isarProvider.overrideWithValue(isar),
            cancellationProvider.overrideWithValue(() => isCancelled),
            driftProvider.overrideWith(driftOverride(drift)),
          ],
        );

        HttpSSLOptions.apply(applyNative: false);
        final result = await config.computation(ref!);

        if (!isCancelled) {
          config.mainSendPort.send(_ResultMessage(result));
        } else {
          log.fine("Task completed but was cancelled - not sending result");
        }
      } catch (error, stack) {
        log.severe("Error in isolate execution", error, stack);
        config.mainSendPort.send(_ErrorMessage(error, stack));
      } finally {
        try {
          receivePort.close();
          unawaited(subscription.cancel());
          await _cleanupResources(ref, isar, drift, logDb);
        } catch (error, stack) {
          dPrint(() => "Error during isolate cleanup: $error with stack: $stack");
        } finally {
          unawaited(subscription.cancel());
          config.mainSendPort.send(const _DoneMessage());
        }
      }
    },
    (error, stack) async {
      dPrint(() => "Uncaught error in isolate zone: $error, $stack");
      receivePort.close();
      unawaited(subscription.cancel());
      await _cleanupResources(ref, isar, drift, logDb);
      config.mainSendPort.send(_ErrorMessage(error, stack));
    },
  );
}

CancellableTask<T> runInIsolateGentle<T>({
  required Future<T> Function(ProviderContainer ref) computation,
  String? debugLabel,
}) {
  final runner = _IsolateTaskRunner<T>(
    debugLabel: debugLabel ?? 'isolate-task-${DateTime.now().millisecondsSinceEpoch}',
  )..start(computation);

  return CancellableTask<T>(future: runner.future, cancel: runner.cancel);
}
