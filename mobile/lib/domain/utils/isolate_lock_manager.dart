import 'dart:isolate';
import 'dart:ui';

import 'package:flutter/foundation.dart';
import 'package:logging/logging.dart';

const String kIsolateLockManagerPort = "immich://isolate_mutex";

enum _LockStatus { active, released }

class _IsolateRequest {
  const _IsolateRequest();
}

class _HeartbeatRequest extends _IsolateRequest {
  // Port for the receiver to send replies back
  final SendPort sendPort;

  const _HeartbeatRequest(this.sendPort);

  Map<String, dynamic> toJson() {
    return {'type': 'heartbeat', 'sendPort': sendPort};
  }
}

class _CloseRequest extends _IsolateRequest {
  const _CloseRequest();

  Map<String, dynamic> toJson() {
    return {'type': 'close'};
  }
}

class _IsolateResponse {
  const _IsolateResponse();
}

class _HeartbeatResponse extends _IsolateResponse {
  final _LockStatus status;

  const _HeartbeatResponse(this.status);

  Map<String, dynamic> toJson() {
    return {'type': 'heartbeat', 'status': status.index};
  }
}

typedef OnCloseLockHolderRequest = void Function();

class IsolateLockManager {
  final String _portName;
  bool _hasLock = false;
  ReceivePort? _receivePort;
  final OnCloseLockHolderRequest? _onCloseRequest;
  final Set<SendPort> _waitingIsolates = {};
  // Token object - a new one is created for each acquisition attempt
  Object? _currentAcquisitionToken;

  IsolateLockManager({String? portName, OnCloseLockHolderRequest? onCloseRequest})
    : _portName = portName ?? kIsolateLockManagerPort,
      _onCloseRequest = onCloseRequest;

  Future<bool> acquireLock() async {
    if (_hasLock) {
      Logger('BackgroundWorkerLockManager').warning("WARNING: [acquireLock] called more than once");
      return true;
    }

    // Create a new token - this invalidates any previous attempt
    final token = _currentAcquisitionToken = Object();

    final ReceivePort rp = _receivePort = ReceivePort(_portName);
    final SendPort sp = rp.sendPort;

    while (!IsolateNameServer.registerPortWithName(sp, _portName)) {
      // This attempt was superseded by a newer one in the same isolate
      if (_currentAcquisitionToken != token) {
        return false;
      }

      await _lockReleasedByHolder(token);
    }

    _hasLock = true;
    rp.listen(_onRequest);
    return true;
  }

  Future<void> _lockReleasedByHolder(Object token) async {
    SendPort? holder = IsolateNameServer.lookupPortByName(_portName);
    debugPrint("Found lock holder: $holder");
    if (holder == null) {
      // No holder, try and acquire lock
      return;
    }

    final ReceivePort tempRp = ReceivePort();
    final SendPort tempSp = tempRp.sendPort;
    final bs = tempRp.asBroadcastStream();

    try {
      while (true) {
        // Send a heartbeat request with the send port to receive reply from the holder

        debugPrint("Sending heartbeat request to lock holder");
        holder.send(_HeartbeatRequest(tempSp).toJson());
        dynamic answer = await bs.first.timeout(const Duration(seconds: 3), onTimeout: () => null);

        debugPrint("Received heartbeat response from lock holder: $answer");
        // This attempt was superseded by a newer one in the same isolate
        if (_currentAcquisitionToken != token) {
          break;
        }

        if (answer == null) {
          // Holder failed, most likely killed without calling releaseLock
          // Check if a different waiting isolate took the lock
          if (holder == IsolateNameServer.lookupPortByName(_portName)) {
            // No, remove the stale lock
            IsolateNameServer.removePortNameMapping(_portName);
          }
          break;
        }

        // Unknown message type received for heartbeat request. Try again
        _IsolateResponse? response = _parseResponse(answer);
        if (response == null || response is! _HeartbeatResponse) {
          break;
        }

        if (response.status == _LockStatus.released) {
          // Holder has released the lock
          break;
        }

        // If the _LockStatus is active, we check again if the task completed
        // by sending a released messaged again, if not, send a new heartbeat again

        // Check if the holder completed its task after the heartbeat
        answer = await bs.first.timeout(
          const Duration(seconds: 3),
          onTimeout: () => const _HeartbeatResponse(_LockStatus.active).toJson(),
        );

        response = _parseResponse(answer);
        if (response is _HeartbeatResponse && response.status == _LockStatus.released) {
          break;
        }
      }
    } catch (e) {
      // Timeout or error
    } finally {
      tempRp.close();
    }
    return;
  }

  _IsolateRequest? _parseRequest(dynamic msg) {
    if (msg is! Map<String, dynamic>) {
      return null;
    }

    return switch (msg['type']) {
      'heartbeat' => _HeartbeatRequest(msg['sendPort']),
      'close' => const _CloseRequest(),
      _ => null,
    };
  }

  _IsolateResponse? _parseResponse(dynamic msg) {
    if (msg is! Map<String, dynamic>) {
      return null;
    }

    return switch (msg['type']) {
      'heartbeat' => _HeartbeatResponse(_LockStatus.values[msg['status']]),
      _ => null,
    };
  }

  // Executed in the isolate with the lock
  void _onRequest(dynamic msg) {
    final request = _parseRequest(msg);
    if (request == null) {
      return;
    }

    if (request is _HeartbeatRequest) {
      // Add the send port to the list of waiting isolates
      _waitingIsolates.add(request.sendPort);
      request.sendPort.send(const _HeartbeatResponse(_LockStatus.active).toJson());
      return;
    }

    if (request is _CloseRequest) {
      _onCloseRequest?.call();
      return;
    }
  }

  void releaseLock() {
    if (_hasLock) {
      IsolateNameServer.removePortNameMapping(_portName);

      // Notify waiting isolates
      for (final port in _waitingIsolates) {
        port.send(const _HeartbeatResponse(_LockStatus.released).toJson());
      }
      _waitingIsolates.clear();

      _hasLock = false;
    }

    _receivePort?.close();
    _receivePort = null;
  }

  void cancel() {
    if (_hasLock) {
      return;
    }

    debugPrint("Cancelling ongoing acquire lock attempts");
    // Create a new token to invalidate ongoing acquire lock attempts
    _currentAcquisitionToken = Object();
  }

  void requestHolderToClose() {
    if (_hasLock) {
      return;
    }

    IsolateNameServer.lookupPortByName(_portName)?.send(const _CloseRequest().toJson());
  }
}
