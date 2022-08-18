import 'dart:async';
import 'dart:developer';
import 'dart:io';
import 'dart:isolate';
import 'dart:ui' show IsolateNameServer, PluginUtilities;
import 'package:cancellation_token_http/http.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/modules/backup/background_service/localization.dart';
import 'package:immich_mobile/modules/backup/models/current_upload_asset.model.dart';
import 'package:immich_mobile/modules/backup/models/error_upload_asset.model.dart';
import 'package:immich_mobile/modules/backup/models/hive_backup_albums.model.dart';
import 'package:immich_mobile/modules/backup/services/backup.service.dart';
import 'package:immich_mobile/modules/login/models/hive_saved_login_info.model.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:photo_manager/photo_manager.dart';

final backgroundServiceProvider = Provider(
  (ref) => BackgroundService(),
);

/// Background backup service
class BackgroundService {
  static const String _portNameLock = "immichLock";
  BackgroundService();
  static const MethodChannel _foregroundChannel =
      MethodChannel('immich/foregroundChannel');
  static const MethodChannel _backgroundChannel =
      MethodChannel('immich/backgroundChannel');
  bool _isForegroundInitialized = false;
  bool _isBackgroundInitialized = false;
  CancellationToken? _cancellationToken;
  bool _canceledBySystem = false;
  int _wantsLockTime = 0;
  bool _hasLock = false;
  SendPort? _waitingIsolate;
  ReceivePort? _rp;

  bool get isForegroundInitialized {
    return _isForegroundInitialized;
  }

  bool get isBackgroundInitialized {
    return _isBackgroundInitialized;
  }

  Future<bool> _initialize() async {
    final callback = PluginUtilities.getCallbackHandle(_nativeEntry)!;
    var result = await _foregroundChannel
        .invokeMethod('initialize', [callback.toRawHandle()]);
    _isForegroundInitialized = true;
    return result;
  }

  /// Ensures that the background service is enqueued if enabled in settings
  Future<bool> resumeServiceIfEnabled() async {
    return await isBackgroundBackupEnabled() &&
        await startService(keepExisting: true);
  }

  /// Enqueues the background service
  Future<bool> startService({
    bool immediate = false,
    bool keepExisting = false,
    bool requireUnmetered = true,
    bool requireCharging = false,
  }) async {
    if (!Platform.isAndroid) {
      return true;
    }
    try {
      if (!_isForegroundInitialized) {
        await _initialize();
      }
      final String title =
          "backup_background_service_default_notification".tr();
      final bool ok = await _foregroundChannel.invokeMethod(
        'start',
        [immediate, keepExisting, requireUnmetered, requireCharging, title],
      );
      return ok;
    } catch (error) {
      return false;
    }
  }

  /// Cancels the background service (if currently running) and removes it from work queue
  Future<bool> stopService() async {
    if (!Platform.isAndroid) {
      return true;
    }
    try {
      if (!_isForegroundInitialized) {
        await _initialize();
      }
      final ok = await _foregroundChannel.invokeMethod('stop');
      return ok;
    } catch (error) {
      return false;
    }
  }

  /// Returns `true` if the background service is enabled
  Future<bool> isBackgroundBackupEnabled() async {
    if (!Platform.isAndroid) {
      return false;
    }
    try {
      if (!_isForegroundInitialized) {
        await _initialize();
      }
      return await _foregroundChannel.invokeMethod("isEnabled");
    } catch (error) {
      return false;
    }
  }

  /// Opens an activity to let the user disable battery optimizations for Immich
  Future<bool> disableBatteryOptimizations() async {
    if (!Platform.isAndroid) {
      return true;
    }
    try {
      if (!_isForegroundInitialized) {
        await _initialize();
      }
      final String message =
          "backup_background_service_disable_battery_optimizations".tr();
      return await _foregroundChannel.invokeMethod(
        'disableBatteryOptimizations',
        message,
      );
    } catch (error) {
      return false;
    }
  }

  /// Updates the notification shown by the background service
  Future<bool> updateNotification({
    String title = "Immich",
    String? content,
  }) async {
    if (!Platform.isAndroid) {
      return true;
    }
    try {
      if (_isBackgroundInitialized) {
        return await _backgroundChannel
            .invokeMethod('updateNotification', [title, content]);
      }
    } catch (error) {
      debugPrint("[updateNotification] failed to communicate with plugin");
    }
    return Future.value(false);
  }

  /// Shows a new priority notification
  Future<bool> showErrorNotification(
    String title,
    String content,
  ) async {
    if (!Platform.isAndroid) {
      return true;
    }
    try {
      if (_isBackgroundInitialized) {
        return await _backgroundChannel
            .invokeMethod('showError', [title, content]);
      }
    } catch (error) {
      debugPrint("[showErrorNotification] failed to communicate with plugin");
    }
    return Future.value(false);
  }

  /// await to ensure this thread (foreground or background) has exclusive access
  Future<bool> acquireLock() async {
    if (!Platform.isAndroid) {
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
            .timeout(const Duration(seconds: 5), onTimeout: () => null);
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
            .timeout(const Duration(seconds: 5), onTimeout: () => false);
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
    if (!Platform.isAndroid) {
      return;
    }
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

  void _setupBackgroundCallHandler() {
    _backgroundChannel.setMethodCallHandler(_callHandler);
    _isBackgroundInitialized = true;
    _backgroundChannel.invokeMethod('initialized');
  }

  Future<bool> _callHandler(MethodCall call) async {
    switch (call.method) {
      case "onAssetsChanged":
        final Future<bool> translationsLoaded = loadTranslations();
        try {
          final bool hasAccess = await acquireLock();
          if (!hasAccess) {
            debugPrint("[_callHandler] could acquire lock, exiting");
            return false;
          }
          await translationsLoaded;
          return await _onAssetsChanged();
        } catch (error) {
          debugPrint(error.toString());
          return false;
        } finally {
          await Hive.close();
          releaseLock();
        }
      case "systemStop":
        _canceledBySystem = true;
        _cancellationToken?.cancel();
        return true;
      default:
        debugPrint("Unknown method ${call.method}");
        return false;
    }
  }

  Future<bool> _onAssetsChanged() async {
    await Hive.initFlutter();

    Hive.registerAdapter(HiveSavedLoginInfoAdapter());
    Hive.registerAdapter(HiveBackupAlbumsAdapter());
    await Hive.openBox(userInfoBox);
    await Hive.openBox<HiveSavedLoginInfo>(hiveLoginInfoBox);

    ApiService apiService = ApiService();
    apiService.setEndpoint(Hive.box(userInfoBox).get(serverEndpointKey));
    apiService.setAccessToken(Hive.box(userInfoBox).get(accessTokenKey));
    BackupService backupService = BackupService(apiService);

    final Box<HiveBackupAlbums> box =
        await Hive.openBox<HiveBackupAlbums>(hiveBackupInfoBox);
    final HiveBackupAlbums? backupAlbumInfo = box.get(backupInfoKey);
    if (backupAlbumInfo == null) {
      return true;
    }

    await PhotoManager.setIgnorePermissionCheck(true);

    if (_canceledBySystem) {
      return false;
    }

    final List<AssetEntity> toUpload =
        await backupService.getAssetsToBackup(backupAlbumInfo);

    if (_canceledBySystem) {
      return false;
    }

    if (toUpload.isEmpty) {
      return true;
    }

    _cancellationToken = CancellationToken();
    final bool ok = await backupService.backupAsset(
      toUpload,
      _cancellationToken!,
      _onAssetUploaded,
      _onProgress,
      _onSetCurrentBackupAsset,
      _onBackupError,
    );
    if (ok) {
      await box.put(
        backupInfoKey,
        backupAlbumInfo,
      );
    }
    return ok;
  }

  void _onAssetUploaded(String deviceAssetId, String deviceId) {
    debugPrint("Uploaded $deviceAssetId from $deviceId");
  }

  void _onProgress(int sent, int total) {}

  void _onBackupError(ErrorUploadAsset errorAssetInfo) {
    showErrorNotification(
      "backup_background_service_upload_failure_notification"
          .tr(args: [errorAssetInfo.fileName]),
      errorAssetInfo.errorMessage,
    );
  }

  void _onSetCurrentBackupAsset(CurrentUploadAsset currentUploadAsset) {
    updateNotification(
      title: "backup_background_service_in_progress_notification".tr(),
      content: "backup_background_service_current_upload_notification"
          .tr(args: [currentUploadAsset.fileName]),
    );
  }
}

/// entry point called by Kotlin/Java code; needs to be a top-level function
void _nativeEntry() {
  WidgetsFlutterBinding.ensureInitialized();
  BackgroundService backgroundService = BackgroundService();
  backgroundService._setupBackgroundCallHandler();
}
