import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/log.service.dart';
import 'package:immich_mobile/domain/utils/isolate_lock_manager.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/models/backup/backup_state.model.dart';
import 'package:immich_mobile/providers/album/album.provider.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/providers/asset.provider.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:immich_mobile/providers/background_sync.provider.dart';
import 'package:immich_mobile/providers/backup/backup.provider.dart';
import 'package:immich_mobile/providers/backup/drift_backup.provider.dart';
import 'package:immich_mobile/providers/backup/ios_background_settings.provider.dart';
import 'package:immich_mobile/providers/backup/manual_upload.provider.dart';
import 'package:immich_mobile/providers/gallery_permission.provider.dart';
import 'package:immich_mobile/providers/memory.provider.dart';
import 'package:immich_mobile/providers/notification_permission.provider.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/providers/tab.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/providers/websocket.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/services/background.service.dart';
import 'package:isar/isar.dart';
import 'package:logging/logging.dart';
import 'package:permission_handler/permission_handler.dart';

enum AppLifeCycleEnum { active, inactive, paused, resumed, detached, hidden }

class AppLifeCycleNotifier extends StateNotifier<AppLifeCycleEnum> {
  final Ref _ref;
  bool _wasPaused = false;
  
  // Add operation coordination
  Completer<void>? _resumeOperation;
  Completer<void>? _pauseOperation;

  AppLifeCycleNotifier(this._ref) : super(AppLifeCycleEnum.active);

  AppLifeCycleEnum getAppState() {
    return state;
  }

  void handleAppResume() async {
    state = AppLifeCycleEnum.resumed;

    // Prevent overlapping resume operations
    if (_resumeOperation != null && !_resumeOperation!.isCompleted) {
      debugPrint("Resume operation already in progress, waiting...");
      await _resumeOperation!.future;
      return;
    }

    // Cancel any ongoing pause operation
    if (_pauseOperation != null && !_pauseOperation!.isCompleted) {
      debugPrint("Cancelling ongoing pause operation for resume");
      _pauseOperation!.complete();
    }

    _resumeOperation = Completer<void>();

    try {
      await _performResume();
    } catch (e, stackTrace) {
      Logger("AppLifeCycleNotifier").severe("Error during app resume", e, stackTrace);
    } finally {
      if (!_resumeOperation!.isCompleted) {
        _resumeOperation!.complete();
      }
      _resumeOperation = null;
    }
  }

  Future<void> _performResume() async {
    // no need to resume because app was never really paused
    if (!_wasPaused) return;
    _wasPaused = false;

    final isAuthenticated = _ref.read(authProvider).isAuthenticated;

    // Needs to be logged in
    if (isAuthenticated) {
      // switch endpoint if needed
      final endpoint = await _ref.read(authProvider.notifier).setOpenApiServiceEndpoint();
      if (kDebugMode) {
        debugPrint("Using server URL: $endpoint");
      }

      if (!Store.isBetaTimelineEnabled) {
        final permission = _ref.watch(galleryPermissionNotifier);
        if (permission.isGranted || permission.isLimited) {
          await _ref.read(backupProvider.notifier).resumeBackup();
          await _ref.read(backgroundServiceProvider).resumeServiceIfEnabled();
        }
      }

      await _ref.read(serverInfoProvider.notifier).getServerVersion();
    }

    if (!Store.isBetaTimelineEnabled) {
      switch (_ref.read(tabProvider)) {
        case TabEnum.home:
          await _ref.read(assetProvider.notifier).getAllAsset();

        case TabEnum.albums:
          await _ref.read(albumProvider.notifier).refreshRemoteAlbums();

        case TabEnum.library:
        case TabEnum.search:
          break;
      }
    } else {
      // Establish websocket connection first before any sync operations
      debugPrint("Connecting websocket on resume");
      _ref.read(websocketProvider.notifier).connect();
      
      await _handleBetaTimelineResume();
    }

    await _ref.read(notificationPermissionProvider.notifier).getNotificationPermission();

    await _ref.read(galleryPermissionNotifier.notifier).getGalleryPermissionStatus();

    if (!Store.isBetaTimelineEnabled) {
      await _ref.read(iOSBackgroundSettingsProvider.notifier).refresh();

      _ref.invalidate(memoryFutureProvider);
    }
  }

  Future<void> _handleBetaTimelineResume() async {
    _ref.read(backupProvider.notifier).cancelBackup();
    final lockManager = _ref.read(isolateLockManagerProvider(kIsolateLockManagerPort));

    lockManager.requestHolderToClose();
    debugPrint("Requested lock holder to close on resume");
    
    // Add timeout to prevent deadlock on lock acquisition
    try {
      await lockManager.acquireLock().timeout(
        const Duration(seconds: 10),
        onTimeout: () {
          Logger("AppLifeCycleNotifier").warning("Lock acquisition timed out, proceeding without lock");
          throw TimeoutException("Lock acquisition timed out", const Duration(seconds: 10));
        },
      );
      debugPrint("Lock acquired for background sync on resume");
    } catch (e) {
      Logger("AppLifeCycleNotifier").warning("Failed to acquire lock: $e");
      return; // Exit early if we can't get the lock
    }

    final backgroundManager = _ref.read(backgroundSyncProvider);
    final isAlbumLinkedSyncEnable = _ref.read(appSettingsServiceProvider).getSetting(AppSettingsEnum.syncAlbums);

    // Ensure proper cleanup before starting new background tasks
    try {
      // Run operations sequentially with state checks
      if (_shouldContinueOperation()) {
        await backgroundManager.syncLocal();
        Logger("AppLifeCycleNotifier").fine("Completed syncLocal");
      }
      
      // Check if app is still active before hashing
      if (_shouldContinueOperation()) {
        await backgroundManager.hashAssets();
        Logger("AppLifeCycleNotifier").fine("Completed hashAssets");
      }
      
      // Check if app is still active before remote sync
      if (_shouldContinueOperation()) {
        await backgroundManager.syncRemote();
        Logger("AppLifeCycleNotifier").fine("Completed syncRemote");
        
        if (isAlbumLinkedSyncEnable && _shouldContinueOperation()) {
          await backgroundManager.syncLinkedAlbum();
          Logger("AppLifeCycleNotifier").fine("Completed syncLinkedAlbum");
        }
      }
      
      // Handle backup resume only if still active
      if (_shouldContinueOperation()) {
        final isEnableBackup = _ref.read(appSettingsServiceProvider).getSetting(AppSettingsEnum.enableBackup);

        if (isEnableBackup) {
          final currentUser = _ref.read(currentUserProvider);
          if (currentUser != null) {
            await _ref.read(driftBackupProvider.notifier).handleBackupResume(currentUser.id);
            Logger("AppLifeCycleNotifier").fine("Completed backup resume");
          }
        }
      }
    } catch (e, stackTrace) {
      Logger("AppLifeCycleNotifier").severe("Error during background sync", e, stackTrace);
      // Ensure lock is released even if operations fail
      try {
        lockManager.releaseLock();
      } catch (lockError) {
        Logger("AppLifeCycleNotifier").warning("Failed to release lock after error: $lockError");
      }
    }
  }

  // Helper method to check if operations should continue
  bool _shouldContinueOperation() {
    return [AppLifeCycleEnum.resumed, AppLifeCycleEnum.active].contains(state) && 
           (_resumeOperation?.isCompleted == false || _resumeOperation == null);
  }

  void handleAppInactivity() {
    state = AppLifeCycleEnum.inactive;
    // do not stop/clean up anything on inactivity: issued on every orientation change
  }

  Future<void> handleAppPause() async {
    state = AppLifeCycleEnum.paused;
    _wasPaused = true;

    // Prevent overlapping pause operations
    if (_pauseOperation != null && !_pauseOperation!.isCompleted) {
      debugPrint("Pause operation already in progress, waiting...");
      await _pauseOperation!.future;
      return;
    }

    // Cancel any ongoing resume operation
    if (_resumeOperation != null && !_resumeOperation!.isCompleted) {
      debugPrint("Cancelling ongoing resume operation for pause");
      _resumeOperation!.complete();
    }

    _pauseOperation = Completer<void>();

    try {
      await _performPause();
    } catch (e, stackTrace) {
      Logger("AppLifeCycleNotifier").severe("Error during app pause", e, stackTrace);
    } finally {
      if (!_pauseOperation!.isCompleted) {
        _pauseOperation!.complete();
      }
      _pauseOperation = null;
    }
  }

  Future<void> _performPause() async {
    if (_ref.read(authProvider).isAuthenticated) {
      if (!Store.isBetaTimelineEnabled) {
        // Do not cancel backup if manual upload is in progress
        if (_ref.read(backupProvider.notifier).backupProgress != BackUpProgressEnum.manualInProgress) {
          _ref.read(backupProvider.notifier).cancelBackup();
        }
      } else {
        final backgroundManager = _ref.read(backgroundSyncProvider);
        debugPrint("Starting background task cancellation on pause");
        
        // Cancel operations with timeout to prevent hanging
        try {
          await Future.wait([
            backgroundManager.cancel().timeout(const Duration(seconds: 5)),
            backgroundManager.cancelLocal().timeout(const Duration(seconds: 5)),
          ]).timeout(const Duration(seconds: 10));
          debugPrint("Completed background task cancellation");
        } catch (e) {
          Logger("AppLifeCycleNotifier").warning("Timeout during background cancellation: $e");
        }
        
        // Always release the lock, even if cancellation failed
        try {
          _ref.read(isolateLockManagerProvider(kIsolateLockManagerPort)).releaseLock();
          debugPrint("Lock released on app pause");
        } catch (e) {
          Logger("AppLifeCycleNotifier").warning("Failed to release lock on pause: $e");
        }
      }

      debugPrint("Disconnecting websocket on pause");
      _ref.read(websocketProvider.notifier).disconnect();
    }

    try {
      LogService.I.flush();
    } catch (e) {
      // Ignore flush errors during pause
    }
  }

  Future<void> handleAppDetached() async {
    state = AppLifeCycleEnum.detached;

    // Flush logs before closing database
    try {
      LogService.I.flush();
    } catch (e) {
      // Ignore flush errors during shutdown
    }

    // Close Isar database safely
    try {
      final isar = Isar.getInstance();
      if (isar != null && isar.isOpen) {
        await isar.close();
      }
    } catch (e) {
      // Ignore close errors during shutdown
    }

    if (Store.isBetaTimelineEnabled) {
      _ref.read(isolateLockManagerProvider(kIsolateLockManagerPort)).releaseLock();
      return;
    }

    // no guarantee this is called at all
    try {
      _ref.read(manualUploadProvider.notifier).cancelBackup();
    } catch (e) {
      // Ignore errors during shutdown
    }
  }

  void handleAppHidden() {
    state = AppLifeCycleEnum.hidden;
    // do not stop/clean up anything on inactivity: issued on every orientation change
  }
}

final appStateProvider = StateNotifierProvider<AppLifeCycleNotifier, AppLifeCycleEnum>((ref) {
  return AppLifeCycleNotifier(ref);
});
