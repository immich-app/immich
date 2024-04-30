import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/album/providers/album.provider.dart';
import 'package:immich_mobile/modules/album/providers/shared_album.provider.dart';
import 'package:immich_mobile/modules/backup/background_service/background.service.dart';
import 'package:immich_mobile/models/backup/backup_state.model.dart';
import 'package:immich_mobile/modules/backup/providers/backup.provider.dart';
import 'package:immich_mobile/modules/backup/providers/ios_background_settings.provider.dart';
import 'package:immich_mobile/modules/backup/providers/manual_upload.provider.dart';
import 'package:immich_mobile/modules/login/providers/authentication.provider.dart';
import 'package:immich_mobile/modules/memories/providers/memory.provider.dart';
import 'package:immich_mobile/modules/onboarding/providers/gallery_permission.provider.dart';
import 'package:immich_mobile/modules/settings/providers/notification_permission.provider.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';
import 'package:immich_mobile/shared/providers/server_info.provider.dart';
import 'package:immich_mobile/shared/providers/tab.provider.dart';
import 'package:immich_mobile/shared/providers/websocket.provider.dart';
import 'package:immich_mobile/shared/services/immich_logger.service.dart';
import 'package:permission_handler/permission_handler.dart';

enum AppStateEnum {
  active,
  inactive,
  paused,
  resumed,
  detached,
  hidden,
}

class AppStateNotiifer extends StateNotifier<AppStateEnum> {
  final Ref _ref;
  bool _wasPaused = false;

  AppStateNotiifer(this._ref) : super(AppStateEnum.active);

  AppStateEnum getAppState() {
    return state;
  }

  void handleAppResume() {
    state = AppStateEnum.resumed;

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
          _ref.read(assetProvider.notifier).getPartnerAssets();
        case TabEnum.search:
        // nothing to do
        case TabEnum.sharing:
          _ref.read(assetProvider.notifier).getPartnerAssets();
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
    state = AppStateEnum.inactive;
    // do not stop/clean up anything on inactivity: issued on every orientation change
  }

  void handleAppPause() {
    state = AppStateEnum.paused;
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
    state = AppStateEnum.detached;
    // no guarantee this is called at all
    _ref.read(manualUploadProvider.notifier).cancelBackup();
  }

  void handleAppHidden() {
    state = AppStateEnum.hidden;
    // do not stop/clean up anything on inactivity: issued on every orientation change
  }
}

final appStateProvider =
    StateNotifierProvider<AppStateNotiifer, AppStateEnum>((ref) {
  return AppStateNotiifer(ref);
});
