import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/log.service.dart';
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

  final _log = Logger("AppLifeCycleNotifier");

  AppLifeCycleNotifier(this._ref) : super(AppLifeCycleEnum.active);

  AppLifeCycleEnum getAppState() {
    return state;
  }

  void handleAppResume() async {
    state = AppLifeCycleEnum.resumed;

    // Prevent overlapping resume operations
    if (_resumeOperation != null && !_resumeOperation!.isCompleted) {
      await _resumeOperation!.future;
      return;
    }

    // Cancel any ongoing pause operation
    if (_pauseOperation != null && !_pauseOperation!.isCompleted) {
      _pauseOperation!.complete();
    }

    _resumeOperation = Completer<void>();

    try {
      await _performResume();
    } catch (e, stackTrace) {
      _log.severe("Error during app resume", e, stackTrace);
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
      _log.info("Using server URL: $endpoint");

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

  Future<void> _safeRun(Future<void> action, String debugName) async {
    if (!_shouldContinueOperation()) {
      return;
    }

    try {
      await action;
    } catch (e, stackTrace) {
      _log.warning("Error during $debugName operation", e, stackTrace);
    }
  }

  Future<void> _handleBetaTimelineResume() async {
    _ref.read(backupProvider.notifier).cancelBackup();

    // Give isolates time to complete any ongoing database transactions
    await Future.delayed(const Duration(milliseconds: 500));

    final backgroundManager = _ref.read(backgroundSyncProvider);
    final isAlbumLinkedSyncEnable = _ref.read(appSettingsServiceProvider).getSetting(AppSettingsEnum.syncAlbums);

    try {
      await Future.wait([
        _safeRun(backgroundManager.syncLocal(), "syncLocal"),
        _safeRun(backgroundManager.syncRemote(), "syncRemote"),
      ]);

      await Future.wait([
        _safeRun(backgroundManager.hashAssets(), "hashAssets").then((_) {
          _resumeBackup();
        }),
        _resumeBackup(),
      ]);

      if (isAlbumLinkedSyncEnable) {
        await _safeRun(backgroundManager.syncLinkedAlbum(), "syncLinkedAlbum");
      }
    } catch (e, stackTrace) {
      _log.severe("Error during background sync", e, stackTrace);
    }
  }

  Future<void> _resumeBackup() async {
    final isEnableBackup = _ref.read(appSettingsServiceProvider).getSetting(AppSettingsEnum.enableBackup);

    if (isEnableBackup) {
      final currentUser = Store.tryGet(StoreKey.currentUser);
      if (currentUser != null) {
        await _safeRun(
          _ref.read(driftBackupProvider.notifier).handleBackupResume(currentUser.id),
          "handleBackupResume",
        );
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
      await _pauseOperation!.future;
      return;
    }

    // Cancel any ongoing resume operation
    if (_resumeOperation != null && !_resumeOperation!.isCompleted) {
      _resumeOperation!.complete();
    }

    _pauseOperation = Completer<void>();

    try {
      await _performPause();
    } catch (e, stackTrace) {
      _log.severe("Error during app pause", e, stackTrace);
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
      }

      _ref.read(websocketProvider.notifier).disconnect();
    }

    try {
      LogService.I.flush();
    } catch (_) {}
  }

  Future<void> handleAppDetached() async {
    state = AppLifeCycleEnum.detached;

    // Flush logs before closing database
    try {
      LogService.I.flush();
    } catch (_) {}

    // Close Isar database safely
    try {
      final isar = Isar.getInstance();
      if (isar != null && isar.isOpen) {
        await isar.close();
      }
    } catch (_) {}

    if (Store.isBetaTimelineEnabled) {
      return;
    }

    // no guarantee this is called at all
    try {
      _ref.read(manualUploadProvider.notifier).cancelBackup();
    } catch (_) {}
  }

  void handleAppHidden() {
    state = AppLifeCycleEnum.hidden;
    // do not stop/clean up anything on inactivity: issued on every orientation change
  }
}

final appStateProvider = StateNotifierProvider<AppLifeCycleNotifier, AppLifeCycleEnum>((ref) {
  return AppLifeCycleNotifier(ref);
});
