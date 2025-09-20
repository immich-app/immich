import 'dart:developer';
import 'dart:isolate';
import 'dart:ui';

import 'package:immich_mobile/utils/debug_print.dart';

enum BackgroundLock {
  localSync._("immichLocalSync"),
  remoteSync._("immichRemoteSync"),
  albumSync._("immichAlbumSync"),
  hash._("immichHash"),
  backup._("immichBackup");

  final String portName;
  const BackgroundLock._(this.portName);
}

Map<BackgroundLock, int> _wantsLockMap = {};
Map<BackgroundLock, bool> _hasLockMap = {};
Map<BackgroundLock, SendPort?> _waitingIsolateMap = {};
Map<BackgroundLock, ReceivePort?> _rpMap = {};

Future<bool> acquireLock(BackgroundLock lock, {Duration? timeout}) async {
  if (_hasLockMap[lock] == true) {
    dPrint(() => "WARNING: [acquireLock] called more than once");
    return true;
  }

  final int lockTime = Timeline.now;
  _wantsLockMap[lock] = lockTime;
  final ReceivePort rp = ReceivePort(lock.portName);
  _rpMap[lock] = rp;
  final SendPort sp = rp.sendPort;

  DateTime? deadline;
  if (timeout != null) {
    deadline = DateTime.now().add(timeout);
  }

  while (!IsolateNameServer.registerPortWithName(sp, lock.portName)) {
    if (deadline != null && DateTime.now().isAfter(deadline)) {
      _wantsLockMap[lock] = 0;
      _rpMap[lock]?.close();
      _rpMap[lock] = null;
      return false;
    }

    try {
      await _checkLockReleasedWithHeartbeat(lock, lockTime, deadline);
    } catch (error) {
      _wantsLockMap[lock] = 0;
      _rpMap[lock]?.close();
      _rpMap[lock] = null;
      return false;
    }

    if (_wantsLockMap[lock] != lockTime) {
      _rpMap[lock]?.close();
      _rpMap[lock] = null;
      return false;
    }
  }

  _hasLockMap[lock] = true;
  rp.listen(_hearBeatListenerForLock(lock));
  return true;
}

Future<void> _checkLockReleasedWithHeartbeat(BackgroundLock lock, final int lockTime, DateTime? deadline) async {
  SendPort? other = IsolateNameServer.lookupPortByName(lock.portName);
  if (other != null) {
    final ReceivePort tempRp = ReceivePort();
    final SendPort tempSp = tempRp.sendPort;
    final bs = tempRp.asBroadcastStream();
    while (_wantsLockMap[lock] == lockTime) {
      if (deadline != null && DateTime.now().isAfter(deadline)) {
        _wantsLockMap[lock] = 0;
        tempRp.close();
        return;
      }

      other.send(tempSp);
      final dynamic answer = await bs.first.timeout(const Duration(seconds: 3), onTimeout: () => null);
      if (_wantsLockMap[lock] != lockTime) {
        break;
      }

      if (deadline != null && DateTime.now().isAfter(deadline)) {
        _wantsLockMap[lock] = 0;
        tempRp.close();
        return;
      }

      if (answer == null) {
        // other isolate failed to answer, assuming it exited without releasing the lock
        if (other == IsolateNameServer.lookupPortByName(lock.portName)) {
          IsolateNameServer.removePortNameMapping(lock.portName);
        }
        break;
      } else if (answer == true) {
        // other isolate released the lock
        break;
      } else if (answer == false) {
        // other isolate is still active
      }

      final dynamic isFinished = await bs.first.timeout(const Duration(seconds: 3), onTimeout: () => false);
      if (isFinished == true) {
        break;
      }

      if (deadline != null && DateTime.now().isAfter(deadline)) {
        _wantsLockMap[lock] = 0;
        tempRp.close();
        return;
      }
    }
    tempRp.close();
  }
}

void Function(dynamic msg) _hearBeatListenerForLock(BackgroundLock lock) {
  return (dynamic msg) {
    if (msg is SendPort) {
      _waitingIsolateMap[lock] = msg;
      msg.send(false);
    }
  };
}

/// releases the exclusive access lock
void releaseLock(BackgroundLock lock) {
  _wantsLockMap[lock] = 0;
  if (_hasLockMap[lock] == true) {
    IsolateNameServer.removePortNameMapping(lock.portName);
    _waitingIsolateMap[lock]?.send(true);
    _waitingIsolateMap[lock] = null;
    _hasLockMap[lock] = false;
  }
  _rpMap[lock]?.close();
  _rpMap[lock] = null;
}
