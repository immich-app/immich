// ignore_for_file: avoid-missing-completer-stack-trace

import 'dart:async';
import 'dart:isolate';
import 'dart:ui';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:immich_mobile/providers/infrastructure/cancel.provider.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/utils/bootstrap.dart';
import 'package:logging/logging.dart';

/// Exception thrown when IsolateManager is used incorrectly from a non-root isolate.
class InvalidIsolateUsageException implements Exception {
  const InvalidIsolateUsageException();

  @override
  String toString() =>
      "IsolateManager should only be used from the root isolate";
}

/// Exception thrown when an isolate computation is cancelled via [IsolateManager.cancel].
class IsolateCancelledException implements Exception {
  final String? debugLabel;
  const IsolateCancelledException([this.debugLabel]);

  @override
  String toString() =>
      "Isolate computation${debugLabel == null ? '' : ' ($debugLabel)'} was cancelled.";
}

/// Signature for the computation function to be executed in the isolate.
/// It receives a Riverpod [ProviderContainer] for dependency injection.
typedef Computation<T> = FutureOr<T> Function(ProviderContainer ref);

enum _IsolateCommand {
  cancel,
  start,
}

/// Manages running a [Computation] in a separate isolate with Riverpod support
/// and optional cancellation.
///
/// Similar to [compute] or [Isolate.run], but provides:
/// - A pre-configured Riverpod [ProviderContainer] to the computation.
/// - An optional `onCancel` computation for cleanup.
/// - A `cancel()` method to attempt cancellation.
class IsolateManager<T> {
  final SendPort _sendPort;
  final ReceivePort _receivePort;
  final Completer<T?> _completer = Completer<T?>();
  final String? _debugLabel;
  StreamSubscription? _subscription;
  bool _isClosed = false;
  bool _isRunning = false;

  IsolateManager._(this._sendPort, this._receivePort, this._debugLabel) {
    _subscription = _receivePort.listen(
      _handleResponseFromIsolate,
      onDone: () {
        // If the port closes before the completer finishes, signal an error.
        if (_completer.isCompleted) {
          return;
        }

        _completer.completeError(
          RemoteError(
            "Isolate terminated unexpectedly${_debugLabel == null ? '' : ' ($_debugLabel)'}",
            "",
          ),
          StackTrace.empty,
        );
        _isClosed = true;
      },
    );
  }

  /// Spawns a new isolate and prepares it to run the [computation].
  ///
  /// - [computation]: The function to run in the isolate.
  /// - [onCancel]: An optional function to run if `cancel()` is called before the computation completes.
  /// - [debugLabel]: An optional label for debugging.
  ///
  /// Must be called from the root isolate.
  static Future<IsolateManager<T>> spawn<T>({
    required Computation<T> computation,
    Computation<T>? onCancel,
    String? debugLabel,
  }) async {
    final Logger logger = Logger("IsolateManager");
    // Port for receiving the [SendPort] from the new isolate.
    final initPort = RawReceivePort();
    // Completer to synchronize the establishment of the main communication channel.
    final connection = Completer<(ReceivePort, SendPort)>.sync();

    initPort.handler = (initialMessage) {
      if (initialMessage == null) {
        // onExit handler message, isolate terminated without sending a SendPort.
        initPort.close();
        connection.completeError(
          RemoteError(
            "Isolate exited unexpectedly during initialization${debugLabel == null ? '' : ' ($debugLabel)'}",
            "",
          ),
          StackTrace.empty,
        );
        return;
      }
      // The first message should be the SendPort for commands.
      final commandPort = initialMessage as SendPort;
      connection.complete(
        (ReceivePort.fromRawReceivePort(initPort), commandPort),
      );
    };

    final token = RootIsolateToken.instance;
    if (token == null) {
      initPort.close(); // Clean up before throwing
      throw const InvalidIsolateUsageException();
    }

    try {
      await Isolate.spawn(
        _IsolateRunner._execute,
        _IsolateRunner(
          computation: computation,
          sendPort: initPort.sendPort,
          token: token,
          onCancel: onCancel,
          debugLabel: debugLabel,
        ),
        errorsAreFatal: true,
        onExit: initPort.sendPort, // Send null on exit
        onError: initPort.sendPort, // Errors during spawn sent here
        debugName: debugLabel,
      );
    } catch (e, s) {
      logger.warning(
        "Failed to spawn isolate${debugLabel == null ? '' : ' - $debugLabel'}",
        e,
        s,
      );
      initPort.close();
      rethrow;
    }

    try {
      final (ReceivePort receivePort, SendPort sendPort) =
          await connection.future;
      return IsolateManager._(sendPort, receivePort, debugLabel);
    } catch (e) {
      // If connection.future completed with an error (e.g., isolate exited early)
      logger.warning(
        "Isolate connection failed${debugLabel == null ? '' : ' - $debugLabel'}",
        e,
      );
      // initPort is closed by the handler in case of error/null message
      rethrow;
    }
  }

  /// Starts the computation in the isolate.
  ///
  /// Returns a future that completes with the result of the computation,
  /// or an error if the computation fails or is cancelled.
  Future<T?> run() {
    if (_isClosed) {
      return Future.error(StateError("IsolateManager is already closed"));
    }
    if (_isRunning) {
      return Future.error(
        StateError("Isolate computation is already running"),
      );
    }
    _isRunning = true;
    _sendPort.send(_IsolateCommand.start);
    return _completer.future;
  }

  /// Attempts to cancel the computation.
  ///
  /// If the computation has not yet completed, this will cause the future
  /// returned by [run] to complete with an [IsolateCancelledException].
  /// An optional `onCancel` computation might be executed in the isolate.
  ///
  /// Does nothing if the computation has already completed or the manager is closed.
  void cancel() {
    if (_isClosed || _completer.isCompleted) {
      return;
    }
    if (!_isRunning) {
      _close(IsolateCancelledException(_debugLabel));
      return;
    }

    // If running, send cancel command. The isolate will handle sending back the error.
    _sendPort.send(_IsolateCommand.cancel);
  }

  /// Closes communication channels and completes the future with the given error.
  void _close([Object? error, StackTrace? stackTrace]) {
    if (_isClosed) return;
    _isClosed = true;
    unawaited(_subscription?.cancel());
    _receivePort.close();
    if (!_completer.isCompleted) {
      if (error == null) {
        _completer.completeError(
          StateError("IsolateManager closed without result or error."),
          StackTrace.empty,
        );
      } else {
        _completer.completeError(error, stackTrace);
      }
    }
  }

  /// Handles messages received from the isolate.
  void _handleResponseFromIsolate(Object? response) {
    if (_isClosed) return;

    // Expect list: [result] or [error, stackTrace] or [IsolateCancelledException]
    final list = response as List<Object?>;
    Object? error;
    StackTrace? stackTrace;

    if (list.length == 2) {
      error = list.firstOrNull;
      final remoteStack = list.elementAtOrNull(1);
      if (remoteStack is StackTrace) {
        stackTrace = remoteStack;
      } else if (error is String && remoteStack is String?) {
        // Reconstruct RemoteError if possible
        error = RemoteError(error, remoteStack ?? "");
        stackTrace = (error as RemoteError).stackTrace;
      }
    } else if (list.length == 1) {
      final result = list.firstOrNull;
      if (result is IsolateCancelledException) {
        error = result;
      } else {
        // Success case
        if (!_completer.isCompleted) {
          _completer.complete(result as T?);
        }
        _close();
        return;
      }
    } else {
      error = RemoteError(
        "Invalid message format from isolate",
        response.toString(),
      );
    }

    // If we reached here, it's an error or cancellation
    _close(error, stackTrace);
  }
}

/// Internal helper class that runs within the isolate.
class _IsolateRunner<T> {
  final Computation<T> _computation;
  final Computation<T>? _onCancel;
  final String? _debugLabel;

  final RootIsolateToken _token;
  final SendPort _sendPort; // Port to send results/errors back to main
  ReceivePort? _receivePort; // Port to receive commands from main
  bool _cancelled = false;
  bool _computationStarted = false;
  ProviderContainer? _ref; // Hold ref for cleanup

  _IsolateRunner({
    required Computation<T> computation,
    required SendPort sendPort,
    required RootIsolateToken token,
    Computation<T>? onCancel,
    String? debugLabel,
  })  : _computation = computation,
        _sendPort = sendPort,
        _token = token,
        _onCancel = onCancel,
        _debugLabel = debugLabel;

  /// Entry point for the isolate.
  static void _execute(_IsolateRunner<Object?> runner) {
    runner._start();
  }

  /// Initializes the isolate environment and listens for commands.
  void _start() {
    BackgroundIsolateBinaryMessenger.ensureInitialized(_token);
    DartPluginRegistrant.ensureInitialized();

    _receivePort = ReceivePort();
    _sendPort.send(_receivePort!.sendPort);

    // Listen for commands from the main isolate.
    // ignore: avoid-passing-async-when-sync-expected
    final _ = _receivePort!.listen((message) async {
      if (_cancelled) return;

      switch (message) {
        case _IsolateCommand.cancel:
          _cancelled = true;
          // Run onCancel if computation hasn't started or finished
          if (_onCancel == null) {
            // Close the receive port and exit when no cleanup is needed
            _sendPort.send([IsolateCancelledException(_debugLabel)]);
            _cleanupAndExit();
          } else {
            await _runCleanup(_onCancel);
          }
          break;
        case _IsolateCommand.start:
          if (_computationStarted) return; // Ignore duplicate start
          _computationStarted = true;
          await _exec();
          _cleanupAndExit();
          break;
      }
    });
  }

  /// Executes the main computation.
  Future<void> _exec() async {
    Logger log = Logger("IsolateRunner");
    try {
      _ref = await _bootstrap();
      if (_cancelled) return;

      final potentiallyAsyncResult = _computation(_ref!);
      final T result;
      if (potentiallyAsyncResult is Future<T>) {
        result = await potentiallyAsyncResult;
      } else {
        result = potentiallyAsyncResult;
      }

      if (_cancelled) return;

      _sendPort.send([result]);
    } catch (error, stack) {
      if (_cancelled) return;
      log.severe(
        "Error in computation${_debugLabel == null ? '' : ' ($_debugLabel)'}",
        error,
        stack,
      );
      _sendPort.send([error, stack]);
    }
    // Cleanup happens in _cleanupAndExit called by the listener
  }

  /// Executes the onCancel computation.
  Future<void> _runCleanup(Computation<T> cleanupFunc) async {
    Logger log = Logger("IsolateRunner");
    try {
      if (_ref == null) {
        log.warning("IsolateRunner cleanup called without ref");
        return;
      }
      await cleanupFunc(_ref!);
    } catch (e, s) {
      log.warning("Error during isolate onCancel cleanup", e, s);
      // Don't send this error back, primary goal is cancellation signal
    }
  }

  Future<ProviderContainer> _bootstrap() async {
    final db = await Bootstrap.initIsar();
    await Bootstrap.initDomain(db, shouldBufferLogs: false);
    return ProviderContainer(
      overrides: [
        dbProvider.overrideWithValue(db),
        isarProvider.overrideWithValue(db),
        cancellationProvider.overrideWithValue(Completer()),
      ],
    );
  }

  /// Closes resources and the receive port.
  Future<void> _cleanupAndExit() async {
    // Always close the db connections and dispose ref if created
    try {
      await _ref?.read(driftProvider).close();
      await _ref?.read(isarProvider).close();
      _ref?.dispose();
    } catch (e) {
      if (kDebugMode) {
        print("Error during resource cleanup: $e");
      }
    } finally {
      _receivePort?.close();
    }
  }
}
