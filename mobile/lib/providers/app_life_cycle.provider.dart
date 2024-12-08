import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/album/album.provider.dart';
import 'package:immich_mobile/services/background.service.dart';
import 'package:immich_mobile/models/backup/backup_state.model.dart';
import 'package:immich_mobile/providers/backup/backup.provider.dart';
import 'package:immich_mobile/providers/backup/ios_background_settings.provider.dart';
import 'package:immich_mobile/providers/backup/manual_upload.provider.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:immich_mobile/providers/memory.provider.dart';
import 'package:immich_mobile/providers/gallery_permission.provider.dart';
import 'package:immich_mobile/providers/notification_permission.provider.dart';
import 'package:immich_mobile/providers/asset.provider.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/providers/tab.provider.dart';
import 'package:immich_mobile/providers/websocket.provider.dart';
import 'package:immich_mobile/services/immich_logger.service.dart';
import 'package:permission_handler/permission_handler.dart';

enum AppLifeCycleEnum {
  active,
  inactive,
  paused,
  resumed,
  detached,
  hidden,
}

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
      final endpoint =
          await _ref.read(authProvider.notifier).setOpenApiServiceEndpoint();
      if (kDebugMode) {
        debugPrint("Using server URL: $endpoint");
      }

      final permission = _ref.watch(galleryPermissionNotifier);
      if (permission.isGranted || permission.isLimited) {
        await _ref.read(backupProvider.notifier).resumeBackup();
        await _ref.read(backgroundServiceProvider).resumeServiceIfEnabled();
      }

      await _ref.read(serverInfoProvider.notifier).getServerVersion();

      switch (_ref.read(tabProvider)) {
        case TabEnum.home:
          await _ref.read(assetProvider.notifier).getAllAsset();
          break;
        case TabEnum.search:
          // nothing to do
          break;

        case TabEnum.albums:
          await _ref.read(albumProvider.notifier).refreshRemoteAlbums();
          break;
        case TabEnum.library:
          // nothing to do
          break;
      }
    }

    _ref.read(websocketProvider.notifier).connect();

    await _ref
        .read(notificationPermissionProvider.notifier)
        .getNotificationPermission();

    await _ref
        .read(galleryPermissionNotifier.notifier)
        .getGalleryPermissionStatus();

    await _ref.read(iOSBackgroundSettingsProvider.notifier).refresh();

    _ref.invalidate(memoryFutureProvider);
  }

  void handleAppInactivity() {
    state = AppLifeCycleEnum.inactive;
    // do not stop/clean up anything on inactivity: issued on every orientation change
  }

  void handleAppPause() {
    state = AppLifeCycleEnum.paused;
    _wasPaused = true;

    if (_ref.read(authProvider).isAuthenticated) {
      // Do not cancel backup if manual upload is in progress
      if (_ref.read(backupProvider.notifier).backupProgress !=
          BackUpProgressEnum.manualInProgress) {
        _ref.read(backupProvider.notifier).cancelBackup();
      }
      _ref.read(websocketProvider.notifier).disconnect();
    }

    ImmichLogger().flush();
  }

  void handleAppDetached() {
    state = AppLifeCycleEnum.detached;
    // no guarantee this is called at all
    _ref.read(manualUploadProvider.notifier).cancelBackup();
  }

  void handleAppHidden() {
    state = AppLifeCycleEnum.hidden;
    // do not stop/clean up anything on inactivity: issued on every orientation change
  }
}

final appStateProvider =
    StateNotifierProvider<AppLifeCycleNotifier, AppLifeCycleEnum>((ref) {
  return AppLifeCycleNotifier(ref);
});
