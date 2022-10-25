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
import 'package:immich_mobile/modules/backup/models/hive_duplicated_assets.model.dart';
import 'package:immich_mobile/modules/backup/services/backup.service.dart';
import 'package:immich_mobile/modules/login/models/hive_saved_login_info.model.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:photo_manager/photo_manager.dart';

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
  static final NumberFormat numberFormat = NumberFormat("###0.##");
  bool _isBackgroundInitialized = false;
  CancellationToken? _cancellationToken;
  bool _canceledBySystem = false;
  int _wantsLockTime = 0;
  bool _hasLock = false;
  SendPort? _waitingIsolate;
  ReceivePort? _rp;
  bool _errorGracePeriodExceeded = true;
  int _uploadedAssetsCount = 0;
  int _assetsToUploadCount = 0;
  int _lastDetailProgressUpdate = 0;
  String _lastPrintedProgress = "";

  bool get isBackgroundInitialized {
    return _isBackgroundInitialized;
  }

  /// Ensures that the background service is enqueued if enabled in settings
  Future<bool> resumeServiceIfEnabled() async {
    return await isBackgroundBackupEnabled() && await enableService();
  }

  /// Enqueues the background service
  Future<bool> enableService({bool immediate = false}) async {
    if (!Platform.isAndroid) {
      return true;
    }
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
  }) async {
    if (!Platform.isAndroid) {
      return true;
    }
    try {
      final bool ok = await _foregroundChannel.invokeMethod(
        'configure',
        [requireUnmetered, requireCharging],
      );
      return ok;
    } catch (error) {
      return false;
    }
  }

  /// Cancels the background service (if currently running) and removes it from work queue
  Future<bool> disableService() async {
    if (!Platform.isAndroid) {
      return true;
    }
    try {
      final ok = await _foregroundChannel.invokeMethod('disable');
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
      return await _foregroundChannel.invokeMethod("isEnabled");
    } catch (error) {
      return false;
    }
  }

  /// Returns `true` if battery optimizations are disabled
  Future<bool> isIgnoringBatteryOptimizations() async {
    if (!Platform.isAndroid) {
      return true;
    }
    try {
      return await _foregroundChannel
          .invokeMethod('isIgnoringBatteryOptimizations');
    } catch (error) {
      return false;
    }
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
    if (!Platform.isAndroid) {
      return true;
    }
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
    if (!Platform.isAndroid) {
      return true;
    }
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
    if (!Platform.isAndroid) {
      return true;
    }
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
          _clearErrorNotifications();
          final bool hasAccess = await acquireLock();
          if (!hasAccess) {
            debugPrint("[_callHandler] could not acquire lock, exiting");
            return false;
          }
          await translationsLoaded;
          final bool ok = await _onAssetsChanged();
          return ok;
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
    Hive.registerAdapter(HiveDuplicatedAssetsAdapter());

    await Hive.openBox(userInfoBox);
    await Hive.openBox<HiveSavedLoginInfo>(hiveLoginInfoBox);
    await Hive.openBox(userSettingInfoBox);
    await Hive.openBox(backgroundBackupInfoBox);
    await Hive.openBox<HiveDuplicatedAssets>(duplicatedAssetsBox);

    ApiService apiService = ApiService();
    apiService.setEndpoint(Hive.box(userInfoBox).get(serverEndpointKey));
    apiService.setAccessToken(Hive.box(userInfoBox).get(accessTokenKey));
    BackupService backupService = BackupService(apiService);
    AppSettingsService settingsService = AppSettingsService();

    final Box<HiveBackupAlbums> box =
        await Hive.openBox<HiveBackupAlbums>(hiveBackupInfoBox);
    final HiveBackupAlbums? backupAlbumInfo = box.get(backupInfoKey);
    if (backupAlbumInfo == null) {
      return true;
    }

    await PhotoManager.setIgnorePermissionCheck(true);

    do {
      final bool backupOk = await _runBackup(
        backupService,
        settingsService,
        backupAlbumInfo,
      );
      if (backupOk) {
        await Hive.box(backgroundBackupInfoBox).delete(backupFailedSince);
        await box.put(
          backupInfoKey,
          backupAlbumInfo,
        );
      } else if (Hive.box(backgroundBackupInfoBox).get(backupFailedSince) ==
          null) {
        Hive.box(backgroundBackupInfoBox)
            .put(backupFailedSince, DateTime.now());
        return false;
      }
      // check for new assets added while performing backup
    } while (true ==
        await _backgroundChannel.invokeMethod<bool>("hasContentChanged"));
    return true;
  }

  Future<bool> _runBackup(
    BackupService backupService,
    AppSettingsService settingsService,
    HiveBackupAlbums backupAlbumInfo,
  ) async {
    _errorGracePeriodExceeded = _isErrorGracePeriodExceeded(settingsService);
    final bool notifyTotalProgress = settingsService
        .getSetting<bool>(AppSettingsEnum.backgroundBackupTotalProgress);
    final bool notifySingleProgress = settingsService
        .getSetting<bool>(AppSettingsEnum.backgroundBackupSingleProgress);

    if (_canceledBySystem) {
      return false;
    }

    List<AssetEntity> toUpload =
        await backupService.buildUploadCandidates(backupAlbumInfo);

    try {
      toUpload = await backupService.removeAlreadyUploadedAssets(toUpload);
    } catch (e) {
      _showErrorNotification(
        title: "backup_background_service_error_title".tr(),
        content: "backup_background_service_connection_failed_message".tr(),
      );
      return false;
    }

    if (_canceledBySystem) {
      return false;
    }

    if (toUpload.isEmpty) {
      return true;
    }
    _assetsToUploadCount = toUpload.length;
    _uploadedAssetsCount = 0;
    _updateNotification(
      title: "backup_background_service_in_progress_notification".tr(),
      content: notifyTotalProgress ? _formatAssetBackupProgress() : null,
      progress: 0,
      max: notifyTotalProgress ? _assetsToUploadCount : 0,
      indeterminate: !notifyTotalProgress,
      onlyIfFG: !notifyTotalProgress,
    );

    _cancellationToken = CancellationToken();
    final bool ok = await backupService.backupAsset(
      toUpload,
      _cancellationToken!,
      notifyTotalProgress ? _onAssetUploaded : (assetId, deviceId, isDup) {},
      notifySingleProgress ? _onProgress : (sent, total) {},
      notifySingleProgress ? _onSetCurrentBackupAsset : (asset) {},
      _onBackupError,
    );
    if (!ok && !_cancellationToken!.isCancelled) {
      _showErrorNotification(
        title: "backup_background_service_error_title".tr(),
        content: "backup_background_service_backup_failed_message".tr(),
      );
    }
    return ok;
  }

  String _formatAssetBackupProgress() {
    final int percent = (_uploadedAssetsCount * 100) ~/ _assetsToUploadCount;
    return "$percent% ($_uploadedAssetsCount/$_assetsToUploadCount)";
  }

  void _onAssetUploaded(String deviceAssetId, String deviceId, bool isDup) {
    debugPrint("Uploaded $deviceAssetId from $deviceId");
    _uploadedAssetsCount++;
    _updateNotification(
      progress: _uploadedAssetsCount,
      max: _assetsToUploadCount,
      content: _formatAssetBackupProgress(),
    );
  }

  void _onProgress(int sent, int total) {
    final int now = Timeline.now;
    // limit updates to 10 per second (or Android drops important notifications)
    if (now > _lastDetailProgressUpdate + 100000) {
      final String msg = _humanReadableBytesProgress(sent, total);
      // only update if message actually differs (to stop many useless notification updates on large assets or slow connections)
      if (msg != _lastPrintedProgress) {
        _lastDetailProgressUpdate = now;
        _lastPrintedProgress = msg;
        _updateNotification(
          progress: sent,
          max: total,
          isDetail: true,
          content: msg,
        );
      }
    }
  }

  void _onBackupError(ErrorUploadAsset errorAssetInfo) {
    _showErrorNotification(
      title: "backup_background_service_upload_failure_notification"
          .tr(args: [errorAssetInfo.fileName]),
      individualTag: errorAssetInfo.id,
    );
  }

  void _onSetCurrentBackupAsset(CurrentUploadAsset currentUploadAsset) {
    _updateNotification(
      title: "backup_background_service_current_upload_notification"
          .tr(args: [currentUploadAsset.fileName]),
      content: "",
      isDetail: true,
      progress: 0,
      max: 0,
    );
  }

  bool _isErrorGracePeriodExceeded(AppSettingsService appSettingsService) {
    final int value = appSettingsService
        .getSetting(AppSettingsEnum.uploadErrorNotificationGracePeriod);
    if (value == 0) {
      return true;
    } else if (value == 5) {
      return false;
    }
    final DateTime? failedSince =
        Hive.box(backgroundBackupInfoBox).get(backupFailedSince);
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

  /// prints percentage and absolute progress in useful (kilo/mega/giga)bytes
  static String _humanReadableBytesProgress(int bytes, int bytesTotal) {
    String unit = "KB"; // Kilobyte
    if (bytesTotal >= 0x40000000) {
      unit = "GB"; // Gigabyte
      bytes >>= 20;
      bytesTotal >>= 20;
    } else if (bytesTotal >= 0x100000) {
      unit = "MB"; // Megabyte
      bytes >>= 10;
      bytesTotal >>= 10;
    } else if (bytesTotal < 0x400) {
      return "$bytes / $bytesTotal B";
    }
    final int percent = (bytes * 100) ~/ bytesTotal;
    final String done = numberFormat.format(bytes / 1024.0);
    final String total = numberFormat.format(bytesTotal / 1024.0);
    return "$percent% ($done/$total$unit)";
  }
}

/// entry point called by Kotlin/Java code; needs to be a top-level function
@pragma('vm:entry-point')
void _nativeEntry() {
  WidgetsFlutterBinding.ensureInitialized();
  BackgroundService backgroundService = BackgroundService();
  backgroundService._setupBackgroundCallHandler();
}
