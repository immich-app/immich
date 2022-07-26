import 'dart:async';
import 'dart:io';
import 'dart:isolate';
import 'dart:ui' show IsolateNameServer, PluginUtilities;
import 'package:cancellation_token_http/http.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/modules/backup/models/current_upload_asset.model.dart';
import 'package:immich_mobile/modules/backup/models/error_upload_asset.model.dart';
import 'package:immich_mobile/modules/backup/models/hive_backup_albums.model.dart';
import 'package:immich_mobile/modules/backup/services/backup.service.dart';
import 'package:immich_mobile/modules/login/models/hive_saved_login_info.model.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:photo_manager/photo_manager.dart';

final backgroundServiceProvider = Provider(
  (ref) => BackgroundService(
    ref.watch(backupServiceProvider),
  ),
);

/// Background backup service
class BackgroundService {
  static const String _portName = "immichLock";
  final BackupService _backupService;
  BackgroundService(this._backupService);
  static const MethodChannel _foregroundChannel =
      MethodChannel('immich/foregroundChannel');
  static const MethodChannel _backgroundChannel =
      MethodChannel('immich/backgroundChannel');
  bool _isForegroundInitialized = false;
  bool _isBackgroundInitialized = false;
  RandomAccessFile? _lockFile;
  CancellationToken? _cancellationToken;
  bool _canceledBySystem = false;
  ReceivePort? _rp;
  Stream<dynamic>? _bs;
  Future<dynamic>? _lockFuture;

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
    return isBackgroundBackupEnabled() &&
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
    if (!_isForegroundInitialized) {
      await _initialize();
    }
    final bool ok = await _foregroundChannel.invokeMethod(
      'start',
      [immediate, keepExisting, requireUnmetered, requireCharging],
    );
    if (ok) {
      Hive.box(hiveBackgroundInfoBox).put(backgroundBackupEnabledKey, true);
    }
    return ok;
  }

  /// Cancels the background service (if currently running) and removes it from work queue
  Future<bool> stopService() async {
    if (!Platform.isAndroid) {
      return true;
    }
    if (!_isForegroundInitialized) {
      await _initialize();
    }
    final ok = await _foregroundChannel.invokeMethod('stop');
    if (ok) {
      Hive.box(hiveBackgroundInfoBox).put(backgroundBackupEnabledKey, false);
    }
    return ok;
  }

  /// Returns `true` if the background service is enabled
  bool isBackgroundBackupEnabled() {
    return Platform.isAndroid &&
        Hive.box(hiveBackgroundInfoBox)
            .get(backgroundBackupEnabledKey, defaultValue: false);
  }

  /// Opens an activity to let the user disable battery optimizations for Immich
  Future<bool> disableBatteryOptimizations() async {
    if (!Platform.isAndroid) {
      return true;
    }
    if (!_isForegroundInitialized) {
      await _initialize();
    }
    // TODO i18n
    const String message =
        "Please disable battery optimization for Immich to enable background backup";
    return await _foregroundChannel.invokeMethod(
      'disableBatteryOptimizations',
      message,
    );
  }

  /// Updates the notification shown by the background service
  Future<bool> updateNotification({
    String title = "Immich",
    String? content,
  }) async {
    if (!Platform.isAndroid) {
      return true;
    }
    if (_isBackgroundInitialized) {
      return await _backgroundChannel
          .invokeMethod('updateNotification', [title, content]);
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
    if (_isBackgroundInitialized) {
      return await _backgroundChannel
          .invokeMethod('showError', [title, content]);
    }
    return Future.value(false);
  }

  /// await to ensure this thread (foreground or background) has exclusive access
  Future<void> acquireLock() async {
    if (!Platform.isAndroid) {
      return;
    }
    ReceivePort rp = ReceivePort(_portName);
    _rp = rp;
    final SendPort sp = rp.sendPort;
    final bool ok = IsolateNameServer.registerPortWithName(sp, _portName);
    final bs = rp.asBroadcastStream();
    _bs = bs;
    if (!ok) {
      SendPort? other = IsolateNameServer.lookupPortByName(_portName);
      if (other != null) {
        other.send(sp);
        _lockFuture = bs.first;
        bool isFinished = await _lockFuture;
        _lockFuture = null;
        assert(isFinished);
      }
    }
  }

  /// releases the exclusive access lock
  Future<void> releaseLock() async {
    if (!Platform.isAndroid) {
      return;
    }
    if (_lockFuture == null) {
      IsolateNameServer.removePortNameMapping(_portName);
      final SendPort? sp = await _bs?.first.timeout(
        const Duration(milliseconds: 100),
        onTimeout: () => null,
      ) as SendPort?;
      sp?.send(true);
    } else {
      _lockFuture?.ignore();
    }
    _bs = null;
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
      case "onPhotosChanged":
        try {
          await acquireLock();
          // await Future.delayed(const Duration(seconds: 30));
          final bool ok = await _onAssetsChanged();
          await Hive.close();
          await releaseLock();
          return ok;
        } catch (error) {
          debugPrint(error.toString());
          return false;
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
        await _backupService.getAssetsToBackup(backupAlbumInfo);

    if (_canceledBySystem) {
      return false;
    }

    if (toUpload.isEmpty) {
      return true;
    }

    _cancellationToken = CancellationToken();
    final bool ok = toUpload.length > 10
        ? true
        : await _backupService.backupAsset(
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
    // TODO i18n
    showErrorNotification(
      "Failed to upload ${errorAssetInfo.fileName}",
      errorAssetInfo.errorMessage,
    );
  }

  void _onSetCurrentBackupAsset(CurrentUploadAsset currentUploadAsset) {
    // TODO i18n
    updateNotification(
      title: "Photo backup running",
      content: "Uploading ${currentUploadAsset.fileName}",
    );
  }
}

/// entry point called by Kotlin/Java code; needs to be a top-level function
void _nativeEntry() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Hive.initFlutter();

  Hive.registerAdapter(HiveSavedLoginInfoAdapter());
  Hive.registerAdapter(HiveBackupAlbumsAdapter());

  await Hive.openBox(userInfoBox);
  await Hive.openBox<HiveSavedLoginInfo>(hiveLoginInfoBox);
  await Hive.openBox(hiveBackgroundInfoBox);

  ApiService apiService = ApiService();
  apiService.setEndpoint(Hive.box(userInfoBox).get(serverEndpointKey));
  apiService.setAccessToken(Hive.box(userInfoBox).get(accessTokenKey));
  BackupService backupService = BackupService(apiService);
  BackgroundService backgroundService = BackgroundService(backupService);
  backgroundService._setupBackgroundCallHandler();
}
