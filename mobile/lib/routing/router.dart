import 'package:auto_route/auto_route.dart';
import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/asset_edit.model.dart';
import 'package:immich_mobile/domain/models/log.model.dart';
import 'package:immich_mobile/domain/models/memory.model.dart';
import 'package:immich_mobile/domain/models/person.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/models/folder/recursive_folder.model.dart';
import 'package:immich_mobile/models/shared_link/shared_link.model.dart';
import 'package:immich_mobile/models/upload/share_intent_attachment.model.dart';
import 'package:immich_mobile/pages/backup/drift_backup.page.dart';
import 'package:immich_mobile/pages/backup/drift_backup_album_selection.page.dart';
import 'package:immich_mobile/pages/backup/drift_backup_asset_detail.page.dart';
import 'package:immich_mobile/pages/backup/drift_backup_options.page.dart';
import 'package:immich_mobile/pages/backup/drift_upload_detail.page.dart';
import 'package:immich_mobile/pages/common/app_log.page.dart';
import 'package:immich_mobile/pages/common/app_log_detail.page.dart';
import 'package:immich_mobile/pages/common/headers_settings.page.dart';
import 'package:immich_mobile/pages/common/settings.page.dart';
import 'package:immich_mobile/pages/common/splash_screen.page.dart';
import 'package:immich_mobile/pages/common/tab_shell.page.dart';
import 'package:immich_mobile/pages/library/folder/folder.page.dart';
import 'package:immich_mobile/pages/library/locked/pin_auth.page.dart';
import 'package:immich_mobile/pages/library/partner/drift_partner.page.dart';
import 'package:immich_mobile/pages/library/shared_link/shared_link.page.dart';
import 'package:immich_mobile/pages/library/shared_link/shared_link_edit.page.dart';
import 'package:immich_mobile/pages/login/change_password.page.dart';
import 'package:immich_mobile/pages/login/login.page.dart';
import 'package:immich_mobile/pages/search/map/map_location_picker.page.dart';
import 'package:immich_mobile/pages/settings/sync_status.page.dart';
import 'package:immich_mobile/pages/share_intent/share_intent.page.dart';
import 'package:immich_mobile/presentation/pages/cleanup_preview.page.dart';
import 'package:immich_mobile/presentation/pages/dev/main_timeline.page.dart';
import 'package:immich_mobile/presentation/pages/dev/media_stat.page.dart';
import 'package:immich_mobile/presentation/pages/download_info.page.dart';
import 'package:immich_mobile/presentation/pages/drift_activities.page.dart';
import 'package:immich_mobile/presentation/pages/drift_album.page.dart';
import 'package:immich_mobile/presentation/pages/drift_album_options.page.dart';
import 'package:immich_mobile/presentation/pages/drift_archive.page.dart';
import 'package:immich_mobile/presentation/pages/drift_asset_selection_timeline.page.dart';
import 'package:immich_mobile/presentation/pages/drift_asset_troubleshoot.page.dart';
import 'package:immich_mobile/presentation/pages/drift_create_album.page.dart';
import 'package:immich_mobile/presentation/pages/drift_favorite.page.dart';
import 'package:immich_mobile/presentation/pages/drift_library.page.dart';
import 'package:immich_mobile/presentation/pages/drift_local_album.page.dart';
import 'package:immich_mobile/presentation/pages/drift_locked_folder.page.dart';
import 'package:immich_mobile/presentation/pages/drift_map.page.dart';
import 'package:immich_mobile/presentation/pages/drift_memory.page.dart';
import 'package:immich_mobile/presentation/pages/drift_partner_detail.page.dart';
import 'package:immich_mobile/presentation/pages/drift_people_collection.page.dart';
import 'package:immich_mobile/presentation/pages/drift_person.page.dart';
import 'package:immich_mobile/presentation/pages/drift_place.page.dart';
import 'package:immich_mobile/presentation/pages/drift_place_detail.page.dart';
import 'package:immich_mobile/presentation/pages/drift_recently_taken.page.dart';
import 'package:immich_mobile/presentation/pages/drift_remote_album.page.dart';
import 'package:immich_mobile/presentation/pages/drift_trash.page.dart';
import 'package:immich_mobile/presentation/pages/drift_user_selection.page.dart';
import 'package:immich_mobile/presentation/pages/drift_video.page.dart';
import 'package:immich_mobile/presentation/pages/edit/drift_edit.page.dart';
import 'package:immich_mobile/presentation/pages/local_timeline.page.dart';
import 'package:immich_mobile/presentation/pages/profile/profile_picture_crop.page.dart';
import 'package:immich_mobile/presentation/pages/search/drift_search.page.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_viewer.page.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/providers/gallery_permission.provider.dart';
import 'package:immich_mobile/routing/auth_guard.dart';
import 'package:immich_mobile/routing/duplicate_guard.dart';
import 'package:immich_mobile/routing/locked_guard.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/services/auth.service.dart';
import 'package:immich_mobile/services/local_auth.service.dart';
import 'package:immich_mobile/services/secure_storage.service.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

part 'router.gr.dart';

final appRouterProvider = Provider(
  (ref) => AppRouter(
    ref.watch(apiServiceProvider),
    ref.watch(authServiceProvider),
    ref.watch(galleryPermissionNotifier.notifier),
    ref.watch(secureStorageServiceProvider),
    ref.watch(localAuthServiceProvider),
  ),
);

@AutoRouterConfig(replaceInRouteName: 'Page,Route')
class AppRouter extends RootStackRouter {
  late final AuthGuard _authGuard;
  late final DuplicateGuard _duplicateGuard;
  late final LockedGuard _lockedGuard;

  AppRouter(
    ApiService apiService,
    AuthService authService,
    GalleryPermissionNotifier galleryPermissionNotifier,
    SecureStorageService secureStorageService,
    LocalAuthService localAuthService,
  ) {
    _authGuard = AuthGuard(apiService, authService);
    _duplicateGuard = const DuplicateGuard();
    _lockedGuard = LockedGuard(apiService, secureStorageService, localAuthService);
  }

  @override
  RouteType get defaultRouteType => const RouteType.material();

  @override
  late final List<AutoRoute> routes = [
    AutoRoute(page: SplashScreenRoute.page, initial: true),
    AutoRoute(page: LoginRoute.page),
    AutoRoute(page: ChangePasswordRoute.page),
    AutoRoute(
      page: TabShellRoute.page,
      guards: [_authGuard, _duplicateGuard],
      children: [
        AutoRoute(page: MainTimelineRoute.page, guards: [_authGuard, _duplicateGuard]),
        AutoRoute(page: DriftSearchRoute.page, guards: [_authGuard, _duplicateGuard], maintainState: false),
        AutoRoute(page: DriftLibraryRoute.page, guards: [_authGuard, _duplicateGuard]),
        AutoRoute(page: DriftAlbumsRoute.page, guards: [_authGuard, _duplicateGuard]),
      ],
    ),
    AutoRoute(page: ProfilePictureCropRoute.page),
    AutoRoute(page: SettingsRoute.page, guards: [_duplicateGuard]),
    AutoRoute(page: SettingsSubRoute.page, guards: [_duplicateGuard]),
    AutoRoute(page: AppLogRoute.page, guards: [_duplicateGuard]),
    AutoRoute(page: AppLogDetailRoute.page, guards: [_duplicateGuard]),
    AutoRoute(page: FolderRoute.page, guards: [_authGuard]),
    AutoRoute(page: SharedLinkRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: SharedLinkEditRoute.page, guards: [_authGuard, _duplicateGuard]),
    CustomRoute(page: MapLocationPickerRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: HeaderSettingsRoute.page, guards: [_duplicateGuard]),
    AutoRoute(page: ShareIntentRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: PinAuthRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: LocalMediaSummaryRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: RemoteMediaSummaryRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: DriftBackupRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: DriftBackupAlbumSelectionRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: LocalTimelineRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: MainTimelineRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: RemoteAlbumRoute.page, guards: [_authGuard]),
    AutoRoute(
      page: AssetViewerRoute.page,
      guards: [_authGuard, _duplicateGuard],
      type: RouteType.custom(
        customRouteBuilder: <T>(context, child, page) => PageRouteBuilder<T>(
          fullscreenDialog: page.fullscreenDialog,
          settings: page,
          pageBuilder: (_, __, ___) => child,
          opaque: false,
          transitionsBuilder: TransitionsBuilders.fadeIn,
        ),
      ),
    ),
    AutoRoute(page: DriftMemoryRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: DriftFavoriteRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: DriftTrashRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: DriftArchiveRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: DriftLockedFolderRoute.page, guards: [_authGuard, _lockedGuard, _duplicateGuard]),
    AutoRoute(page: DriftVideoRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: DriftLibraryRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: DriftAssetSelectionTimelineRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: DriftPartnerDetailRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: DriftRecentlyTakenRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: DriftLocalAlbumsRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: DriftCreateAlbumRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: DriftPlaceRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: DriftPlaceDetailRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: DriftUserSelectionRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: DriftPartnerRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: DriftUploadDetailRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: SyncStatusRoute.page, guards: [_duplicateGuard]),
    AutoRoute(page: DriftPeopleCollectionRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: DriftPersonRoute.page, guards: [_authGuard]),
    AutoRoute(page: DriftBackupOptionsRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: DriftAlbumOptionsRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: DriftMapRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: DriftEditImageRoute.page),
    AutoRoute(page: DriftActivitiesRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: DriftBackupAssetDetailRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: AssetTroubleshootRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: DownloadInfoRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: CleanupPreviewRoute.page, guards: [_authGuard, _duplicateGuard]),
    // required to handle all deeplinks in deep_link.service.dart
    // auto_route_library#1722
    RedirectRoute(path: '*', redirectTo: '/'),
  ];
}
