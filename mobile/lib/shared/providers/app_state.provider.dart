import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/album/providers/album.provider.dart';
import 'package:immich_mobile/modules/album/providers/shared_album.provider.dart';
import 'package:immich_mobile/modules/backup/background_service/background.service.dart';
import 'package:immich_mobile/modules/backup/models/backup_state.model.dart';
import 'package:immich_mobile/modules/backup/providers/backup.provider.dart';
import 'package:immich_mobile/modules/backup/providers/ios_background_settings.provider.dart';
import 'package:immich_mobile/modules/backup/providers/manual_upload.provider.dart';
import 'package:immich_mobile/modules/login/providers/authentication.provider.dart';
import 'package:immich_mobile/modules/memories/providers/memory.provider.dart';
import 'package:immich_mobile/modules/onboarding/providers/gallery_permission.provider.dart';
import 'package:immich_mobile/modules/settings/providers/notification_permission.provider.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';
import 'package:immich_mobile/shared/providers/release_info.provider.dart';
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
  final Ref ref;

  AppStateNotiifer(this.ref) : super(AppStateEnum.active);

  void updateAppState(AppStateEnum appState) {
    state = appState;
  }

  AppStateEnum getAppState() {
    return state;
  }

  void handleAppResume() {
    state = AppStateEnum.resumed;

    var isAuthenticated = ref.watch(authenticationProvider).isAuthenticated;
    final permission = ref.watch(galleryPermissionNotifier);

    // Needs to be logged in and have gallery permissions
    if (isAuthenticated && (permission.isGranted || permission.isLimited)) {
      ref.read(backupProvider.notifier).resumeBackup();
      ref.read(backgroundServiceProvider).resumeServiceIfEnabled();
      ref.read(serverInfoProvider.notifier).getServerVersion();
      switch (ref.read(tabProvider)) {
        case TabEnum.home:
          ref.read(assetProvider.notifier).getAllAsset();
        case TabEnum.search:
        // nothing to do
        case TabEnum.sharing:
          ref.read(assetProvider.notifier).getPartnerAssets();
          ref.read(sharedAlbumProvider.notifier).getAllSharedAlbums();
        case TabEnum.library:
          ref.read(albumProvider.notifier).getAllAlbums();
      }
    }

    ref.watch(websocketProvider.notifier).connect();

    ref.watch(releaseInfoProvider.notifier).checkGithubReleaseInfo();

    ref
        .watch(notificationPermissionProvider.notifier)
        .getNotificationPermission();
    ref.watch(galleryPermissionNotifier.notifier).getGalleryPermissionStatus();

    ref.read(iOSBackgroundSettingsProvider.notifier).refresh();

    ref.invalidate(memoryFutureProvider);
  }

  void handleAppInactivity() {
    state = AppStateEnum.inactive;

    // Do not handle inactivity if manual upload is in progress
    if (ref.watch(backupProvider.notifier).backupProgress !=
        BackUpProgressEnum.manualInProgress) {
      ImmichLogger().flush();
      ref.read(websocketProvider.notifier).disconnect();
      ref.read(backupProvider.notifier).cancelBackup();
    }
  }

  void handleAppPause() {
    state = AppStateEnum.paused;
  }

  void handleAppDetached() {
    state = AppStateEnum.detached;
    ref.watch(manualUploadProvider.notifier).cancelBackup();
  }

  void handleAppHidden() {
    state = AppStateEnum.hidden;
  }
}

final appStateProvider =
    StateNotifierProvider<AppStateNotiifer, AppStateEnum>((ref) {
  return AppStateNotiifer(ref);
});
