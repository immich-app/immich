import 'dart:async';
import 'dart:developer';
import 'dart:io';
import 'dart:isolate';
import 'dart:ui' show DartPluginRegistrant, IsolateNameServer, PluginUtilities;
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/backup/current_upload_asset.model.dart';
import 'package:immich_mobile/models/backup/error_upload_asset.model.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/utils/backup_progress.dart';
import 'package:immich_mobile/utils/http_ssl_cert_override.dart';

final backgroundServiceProvider = Provider(
  (ref) => BackgroundService(),
);

/// Background backup service
class BackgroundService {
  static const String _portNameLock = "immichLock";
  static const MethodChannel _foregroundChannel =
      MethodChannel('immich/foregroundChannel');
  static const MethodChannel _backgroundChannel =
      MethodChannel('immich/backgroundChannel');
  static const notifyInterval = Duration(milliseconds: 400);
  final bool _isBackgroundInitialized = false;
  int _wantsLockTime = 0;
  bool _hasLock = false;
  SendPort? _waitingIsolate;
  ReceivePort? _rp;
  final bool _errorGracePeriodExceeded = true;
  final int _uploadedAssetsCount = 0;
  final int _assetsToUploadCount = 0;
  String _lastPrintedDetailContent = "";
  String? _lastPrintedDetailTitle;
  late final ThrottleProgressUpdate _throttledDetailNotify =
      ThrottleProgressUpdate(_updateDetailProgress, notifyInterval);

  bool get isBackgroundInitialized {
    return _isBackgroundInitialized;
  }

  /// Ensures that the background service is enqueued if enabled in settings
  Future<bool> resumeServiceIfEnabled() async {
    return await isBackgroundBackupEnabled() && await enableService();
  }

  /// Enqueues the background service
  Future<bool> enableService({bool immediate = false}) async {
    try {
      final callback = PluginUtilities.getCallbackHandle(_nativeEntry)!;
      final String title =
          "backup_background_service_default_notification".tr();
      final bool ok = await _foregroundChannel
          .invokeMethod('enable', [callback.toRawHandle(), title, immediate]);
      return ok;
    } catch (error) {
      return false;
    }
  }

  /// Configures the background service
  Future<bool> configureService({
    bool requireUnmetered = true,
    bool requireCharging = false,
    int triggerUpdateDelay = 5000,
    int triggerMaxDelay = 50000,
  }) async {
    try {
      final bool ok = await _foregroundChannel.invokeMethod(
        'configure',
        [
          requireUnmetered,
          requireCharging,
          triggerUpdateDelay,
          triggerMaxDelay,
        ],
      );
      return ok;
    } catch (error) {
      return false;
    }
  }

  /// Cancels the background service (if currently running) and removes it from work queue
  Future<bool> disableService() async {
    try {
      final ok = await _foregroundChannel.invokeMethod('disable');
      return ok;
    } catch (error) {
      return false;
    }
  }

  /// Returns `true` if the background service is enabled
  Future<bool> isBackgroundBackupEnabled() async {
    try {
      return await _foregroundChannel.invokeMethod("isEnabled");
    } catch (error) {
      return false;
    }
  }

  /// Returns `true` if battery optimizations are disabled
  Future<bool> isIgnoringBatteryOptimizations() async {
    // iOS does not need battery optimizations enabled
    if (Platform.isIOS) {
      return true;
    }
    try {
      return await _foregroundChannel
          .invokeMethod('isIgnoringBatteryOptimizations');
    } catch (error) {
      return false;
    }
  }

  // Yet to be implemented
  Future<Uint8List?> digestFile(String path) {
    return _foregroundChannel.invokeMethod<Uint8List>("digestFile", [path]);
  }

  Future<List<Uint8List?>?> digestFiles(List<String> paths) {
    return _foregroundChannel.invokeListMethod<Uint8List?>(
      "digestFiles",
      paths,
    );
  }

  /// Updates the notification shown by the background service
  Future<bool?> _updateNotification({
    String? title,
    String? content,
    int progress = 0,
    int max = 0,
    bool indeterminate = false,
    bool isDetail = false,
    bool onlyIfFG = false,
  }) async {
    try {
      if (_isBackgroundInitialized) {
        return _backgroundChannel.invokeMethod<bool>(
          'updateNotification',
          [title, content, progress, max, indeterminate, isDetail, onlyIfFG],
        );
      }
    } catch (error) {
      debugPrint("[_updateNotification] failed to communicate with plugin");
    }
    return false;
  }

  /// Shows a new priority notification
  Future<bool> _showErrorNotification({
    required String title,
    String? content,
    String? individualTag,
  }) async {
    try {
      if (_isBackgroundInitialized && _errorGracePeriodExceeded) {
        return await _backgroundChannel
            .invokeMethod('showError', [title, content, individualTag]);
      }
    } catch (error) {
      debugPrint("[_showErrorNotification] failed to communicate with plugin");
    }
    return false;
  }

  Future<bool> _clearErrorNotifications() async {
    try {
      if (_isBackgroundInitialized) {
        return await _backgroundChannel.invokeMethod('clearErrorNotifications');
      }
    } catch (error) {
      debugPrint(
        "[_clearErrorNotifications] failed to communicate with plugin",
      );
    }
    return false;
  }

  /// await to ensure this thread (foreground or background) has exclusive access
  Future<bool> acquireLock() async {
    if (_hasLock) {
      debugPrint("WARNING: [acquireLock] called more than once");
      return true;
    }
    final int lockTime = Timeline.now;
    _wantsLockTime = lockTime;
    final ReceivePort rp = ReceivePort(_portNameLock);
    _rp = rp;
    final SendPort sp = rp.sendPort;

    while (!IsolateNameServer.registerPortWithName(sp, _portNameLock)) {
      try {
        await _checkLockReleasedWithHeartbeat(lockTime);
      } catch (error) {
        return false;
      }
      if (_wantsLockTime != lockTime) {
        return false;
      }
    }
    _hasLock = true;
    rp.listen(_heartbeatListener);
    return true;
  }

  Future<void> _checkLockReleasedWithHeartbeat(final int lockTime) async {
    SendPort? other = IsolateNameServer.lookupPortByName(_portNameLock);
    if (other != null) {
      final ReceivePort tempRp = ReceivePort();
      final SendPort tempSp = tempRp.sendPort;
      final bs = tempRp.asBroadcastStream();
      while (_wantsLockTime == lockTime) {
        other.send(tempSp);
        final dynamic answer = await bs.first
            .timeout(const Duration(seconds: 3), onTimeout: () => null);
        if (_wantsLockTime != lockTime) {
          break;
        }
        if (answer == null) {
          // other isolate failed to answer, assuming it exited without releasing the lock
          if (other == IsolateNameServer.lookupPortByName(_portNameLock)) {
            IsolateNameServer.removePortNameMapping(_portNameLock);
          }
          break;
        } else if (answer == true) {
          // other isolate released the lock
          break;
        } else if (answer == false) {
          // other isolate is still active
        }
        final dynamic isFinished = await bs.first
            .timeout(const Duration(seconds: 3), onTimeout: () => false);
        if (isFinished == true) {
          break;
        }
      }
      tempRp.close();
    }
  }

  void _heartbeatListener(dynamic msg) {
    if (msg is SendPort) {
      _waitingIsolate = msg;
      msg.send(false);
    }
  }

  /// releases the exclusive access lock
  void releaseLock() {
    _wantsLockTime = 0;
    if (_hasLock) {
      IsolateNameServer.removePortNameMapping(_portNameLock);
      _waitingIsolate?.send(true);
      _waitingIsolate = null;
      _hasLock = false;
    }
    _rp?.close();
    _rp = null;
  }

  void _updateDetailProgress(String? title, int progress, int total) {
    final String msg =
        total > 0 ? humanReadableBytesProgress(progress, total) : "";
    // only update if message actually differs (to stop many useless notification updates on large assets or slow connections)
    if (msg != _lastPrintedDetailContent || _lastPrintedDetailTitle != title) {
      _lastPrintedDetailContent = msg;
      _lastPrintedDetailTitle = title;
      _updateNotification(
        progress: total > 0 ? (progress * 1000) ~/ total : 0,
        max: 1000,
        isDetail: true,
        title: title,
        content: msg,
      );
    }
  }

  void _updateProgress(String? title, int progress, int total) {
    _updateNotification(
      progress: _uploadedAssetsCount,
      max: _assetsToUploadCount,
      title: title,
      content: formatAssetBackupProgress(
        _uploadedAssetsCount,
        _assetsToUploadCount,
      ),
    );
  }

  void _onBackupError(ErrorUploadAsset errorAssetInfo) {
    _showErrorNotification(
      title: "backup_background_service_upload_failure_notification"
          .tr(args: [errorAssetInfo.fileName]),
      individualTag: errorAssetInfo.id,
    );
  }

  void _onSetCurrentBackupAsset(CurrentUploadAsset currentUploadAsset) {
    _throttledDetailNotify.title =
        "backup_background_service_current_upload_notification"
            .tr(args: [currentUploadAsset.fileName]);
    _throttledDetailNotify.progress = 0;
    _throttledDetailNotify.total = 0;
  }

  bool _isErrorGracePeriodExceeded(AppSettingsService appSettingsService) {
    final int value = appSettingsService
        .getSetting(AppSettingsEnum.uploadErrorNotificationGracePeriod);
    if (value == 0) {
      return true;
    } else if (value == 5) {
      return false;
    }
    final DateTime? failedSince = Store.tryGet(StoreKey.backupFailedSince);
    if (failedSince == null) {
      return false;
    }
    final Duration duration = DateTime.now().difference(failedSince);
    if (value == 1) {
      return duration > const Duration(minutes: 30);
    } else if (value == 2) {
      return duration > const Duration(hours: 2);
    } else if (value == 3) {
      return duration > const Duration(hours: 8);
    } else if (value == 4) {
      return duration > const Duration(hours: 24);
    }
    assert(false, "Invalid value");
    return true;
  }

  Future<DateTime?> getIOSBackupLastRun(IosBackgroundTask task) async {
    if (!Platform.isIOS) {
      return null;
    }
    // Seconds since last run
    final double? lastRun = task == IosBackgroundTask.fetch
        ? await _foregroundChannel.invokeMethod('lastBackgroundFetchTime')
        : await _foregroundChannel.invokeMethod('lastBackgroundProcessingTime');
    if (lastRun == null) {
      return null;
    }
    final time = DateTime.fromMillisecondsSinceEpoch(lastRun.toInt() * 1000);
    return time;
  }

  Future<int> getIOSBackupNumberOfProcesses() async {
    if (!Platform.isIOS) {
      return 0;
    }
    return await _foregroundChannel.invokeMethod('numberOfBackgroundProcesses');
  }

  Future<bool> getIOSBackgroundAppRefreshEnabled() async {
    if (!Platform.isIOS) {
      return false;
    }
    return await _foregroundChannel.invokeMethod('backgroundAppRefreshEnabled');
  }
}

enum IosBackgroundTask { fetch, processing }

/// entry point called by Kotlin/Java code; needs to be a top-level function
@pragma('vm:entry-point')
void _nativeEntry() {
  HttpOverrides.global = HttpSSLCertOverride();
  WidgetsFlutterBinding.ensureInitialized();
  DartPluginRegistrant.ensureInitialized();
  // BackgroundService backgroundService = BackgroundService();
  // backgroundService._setupBackgroundCallHandler();
}
