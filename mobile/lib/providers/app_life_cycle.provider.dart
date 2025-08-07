import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
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

  AppLifeCycleNotifier(this._ref) : super(AppLifeCycleEnum.active);

  AppLifeCycleEnum getAppState() {
    return state;
  }

  void handleAppResume() async {
    state = AppLifeCycleEnum.resumed;

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
      _ref.read(backupProvider.notifier).cancelBackup();

      final backgroundManager = _ref.read(backgroundSyncProvider);
      // Ensure proper cleanup before starting new background tasks
      try {
        await Future.wait([
          Future(() async {
            await backgroundManager.syncLocal();
            Logger("AppLifeCycleNotifier").fine("Hashing assets after syncLocal");
            // Check if app is still active before hashing
            if ([AppLifeCycleEnum.resumed, AppLifeCycleEnum.active].contains(state)) {
              await backgroundManager.hashAssets();
            }
          }),
          backgroundManager.syncRemote(),
        ]).then((_) async {
          final isEnableBackup = _ref.read(appSettingsServiceProvider).getSetting(AppSettingsEnum.enableBackup);

          if (isEnableBackup) {
            final currentUser = _ref.read(currentUserProvider);
            if (currentUser == null) {
              return;
            }

            await _ref.read(driftBackupProvider.notifier).handleBackupResume(currentUser.id);
          }
        });
      } catch (e, stackTrace) {
        Logger("AppLifeCycleNotifier").severe("Error during background sync", e, stackTrace);
      }
    }

    _ref.read(websocketProvider.notifier).connect();

    await _ref.read(notificationPermissionProvider.notifier).getNotificationPermission();

    await _ref.read(galleryPermissionNotifier.notifier).getGalleryPermissionStatus();

    if (!Store.isBetaTimelineEnabled) {
      await _ref.read(iOSBackgroundSettingsProvider.notifier).refresh();

      _ref.invalidate(memoryFutureProvider);
    }
  }

  void handleAppInactivity() {
    state = AppLifeCycleEnum.inactive;
    // do not stop/clean up anything on inactivity: issued on every orientation change
  }

  void handleAppPause() {
    state = AppLifeCycleEnum.paused;
    _wasPaused = true;

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
