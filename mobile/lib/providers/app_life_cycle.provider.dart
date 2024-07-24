import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/album/album.provider.dart';
import 'package:immich_mobile/providers/album/shared_album.provider.dart';
import 'package:immich_mobile/services/background.service.dart';
import 'package:immich_mobile/models/backup/backup_state.model.dart';
import 'package:immich_mobile/providers/backup/backup.provider.dart';
import 'package:immich_mobile/providers/backup/ios_background_settings.provider.dart';
import 'package:immich_mobile/providers/backup/manual_upload.provider.dart';
import 'package:immich_mobile/providers/authentication.provider.dart';
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

  void handleAppResume() {
    state = AppLifeCycleEnum.resumed;

    // no need to resume because app was never really paused
    if (!_wasPaused) return;
    _wasPaused = false;

    final isAuthenticated = _ref.read(authenticationProvider).isAuthenticated;

    // Needs to be logged in
    if (isAuthenticated) {
      final permission = _ref.watch(galleryPermissionNotifier);
      if (permission.isGranted || permission.isLimited) {
        _ref.read(backupProvider.notifier).resumeBackup();
        _ref.read(backgroundServiceProvider).resumeServiceIfEnabled();
      }
      _ref.read(serverInfoProvider.notifier).getServerVersion();
      switch (_ref.read(tabProvider)) {
        case TabEnum.home:
          _ref.read(assetProvider.notifier).getAllAsset();
        case TabEnum.search:
        // nothing to do
        case TabEnum.sharing:
          _ref.read(assetProvider.notifier).getAllAsset();
          _ref.read(sharedAlbumProvider.notifier).getAllSharedAlbums();
        case TabEnum.library:
          _ref.read(albumProvider.notifier).getAllAlbums();
      }
    }

    _ref.read(websocketProvider.notifier).connect();

    _ref
        .read(notificationPermissionProvider.notifier)
        .getNotificationPermission();
    _ref.read(galleryPermissionNotifier.notifier).getGalleryPermissionStatus();

    _ref.read(iOSBackgroundSettingsProvider.notifier).refresh();

    _ref.invalidate(memoryFutureProvider);
  }

  void handleAppInactivity() {
    state = AppLifeCycleEnum.inactive;
    // do not stop/clean up anything on inactivity: issued on every orientation change
  }

  void handleAppPause() {
    state = AppLifeCycleEnum.paused;
    _wasPaused = true;
    // Do not cancel backup if manual upload is in progress
    if (_ref.read(backupProvider.notifier).backupProgress !=
        BackUpProgressEnum.manualInProgress) {
      _ref.read(backupProvider.notifier).cancelBackup();
    }
    _ref.read(websocketProvider.notifier).disconnect();
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
