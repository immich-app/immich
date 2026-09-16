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
import 'package:immich_mobile/pages/backup/backup.page.dart';
import 'package:immich_mobile/pages/backup/backup_album_selection.page.dart';
import 'package:immich_mobile/pages/backup/backup_asset_detail.page.dart';
import 'package:immich_mobile/pages/backup/backup_options.page.dart';
import 'package:immich_mobile/pages/backup/upload_detail.page.dart';
import 'package:immich_mobile/pages/common/app_log.page.dart';
import 'package:immich_mobile/pages/common/app_log_detail.page.dart';
import 'package:immich_mobile/pages/common/headers_settings.page.dart';
import 'package:immich_mobile/pages/common/settings.page.dart';
import 'package:immich_mobile/pages/common/splash_screen.page.dart';
import 'package:immich_mobile/pages/common/tab_shell.page.dart';
import 'package:immich_mobile/pages/library/folder/folder.page.dart';
import 'package:immich_mobile/pages/library/locked/pin_auth.page.dart';
import 'package:immich_mobile/pages/library/partner/partner.page.dart';
import 'package:immich_mobile/pages/library/shared_link/shared_link.page.dart';
import 'package:immich_mobile/pages/library/shared_link/shared_link_edit.page.dart';
import 'package:immich_mobile/pages/login/change_password.page.dart';
import 'package:immich_mobile/pages/login/login.page.dart';
import 'package:immich_mobile/pages/search/map/map_location_picker.page.dart';
import 'package:immich_mobile/pages/settings/sync_status.page.dart';
import 'package:immich_mobile/pages/share_intent/share_intent.page.dart';
import 'package:immich_mobile/presentation/pages/activities.page.dart';
import 'package:immich_mobile/presentation/pages/album.page.dart';
import 'package:immich_mobile/presentation/pages/album_options.page.dart';
import 'package:immich_mobile/presentation/pages/archive.page.dart';
import 'package:immich_mobile/presentation/pages/asset_selection_timeline.page.dart';
import 'package:immich_mobile/presentation/pages/asset_troubleshoot.page.dart';
import 'package:immich_mobile/presentation/pages/cleanup_preview.page.dart';
import 'package:immich_mobile/presentation/pages/create_album.page.dart';
import 'package:immich_mobile/presentation/pages/dev/main_timeline.page.dart';
import 'package:immich_mobile/presentation/pages/dev/media_stat.page.dart';
import 'package:immich_mobile/presentation/pages/download_info.page.dart';
import 'package:immich_mobile/presentation/pages/edit/edit.page.dart';
import 'package:immich_mobile/presentation/pages/favorite.page.dart';
import 'package:immich_mobile/presentation/pages/feature_message/whats_new.page.dart';
import 'package:immich_mobile/presentation/pages/library.page.dart';
import 'package:immich_mobile/presentation/pages/local_album.page.dart';
import 'package:immich_mobile/presentation/pages/local_timeline.page.dart';
import 'package:immich_mobile/presentation/pages/locked_folder.page.dart';
import 'package:immich_mobile/presentation/pages/map.page.dart';
import 'package:immich_mobile/presentation/pages/memory.page.dart';
import 'package:immich_mobile/presentation/pages/memory_list.page.dart';
import 'package:immich_mobile/presentation/pages/partner_detail.page.dart';
import 'package:immich_mobile/presentation/pages/people_collection.page.dart';
import 'package:immich_mobile/presentation/pages/person.page.dart';
import 'package:immich_mobile/presentation/pages/place.page.dart';
import 'package:immich_mobile/presentation/pages/place_detail.page.dart';
import 'package:immich_mobile/presentation/pages/profile/profile_picture_crop.page.dart';
import 'package:immich_mobile/presentation/pages/recently_added.page.dart';
import 'package:immich_mobile/presentation/pages/recently_taken.page.dart';
import 'package:immich_mobile/presentation/pages/remote_album.page.dart';
import 'package:immich_mobile/presentation/pages/search/search.page.dart';
import 'package:immich_mobile/presentation/pages/slideshow.page.dart';
import 'package:immich_mobile/presentation/pages/trash.page.dart';
import 'package:immich_mobile/presentation/pages/user_selection.page.dart';
import 'package:immich_mobile/presentation/pages/video.page.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_viewer.page.dart';
import 'package:immich_mobile/providers/api.provider.dart';
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
  // ignore: dispose-provided-instances
  (ref) => AppRouter(
    ref.watch(apiServiceProvider),
    ref.watch(authServiceProvider),
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
        AutoRoute(page: SearchRoute.page, guards: [_authGuard, _duplicateGuard], maintainState: false),
        AutoRoute(page: LibraryRoute.page, guards: [_authGuard, _duplicateGuard]),
        AutoRoute(page: AlbumsRoute.page, guards: [_authGuard, _duplicateGuard]),
      ],
    ),
    AutoRoute(page: ProfilePictureCropRoute.page),
    AutoRoute(page: SettingsRoute.page, guards: [_duplicateGuard]),
    AutoRoute(page: SettingsSubRoute.page, guards: [_duplicateGuard]),
    AutoRoute(page: WhatsNewRoute.page, guards: [_duplicateGuard]),
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
    AutoRoute(page: BackupRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: BackupAlbumSelectionRoute.page, guards: [_authGuard, _duplicateGuard]),
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
          pageBuilder: (_, _, _) => child,
          opaque: false,
          transitionsBuilder: TransitionsBuilders.fadeIn,
        ),
      ),
    ),
    AutoRoute(page: MemoryRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: FavoriteRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: TrashRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: ArchiveRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: LockedFolderRoute.page, guards: [_authGuard, _lockedGuard, _duplicateGuard]),
    AutoRoute(page: VideoRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: LibraryRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: AssetSelectionTimelineRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: PartnerDetailRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: RecentlyTakenRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: RecentlyAddedRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: LocalAlbumsRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: CreateAlbumRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: PlaceRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: PlaceDetailRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: UserSelectionRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: PartnerRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: UploadDetailRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: SyncStatusRoute.page, guards: [_duplicateGuard]),
    AutoRoute(page: PeopleCollectionRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: PersonRoute.page, guards: [_authGuard]),
    AutoRoute(page: BackupOptionsRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: AlbumOptionsRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: MapRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: EditImageRoute.page),
    AutoRoute(page: ActivitiesRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: BackupAssetDetailRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: AssetTroubleshootRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: DownloadInfoRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: CleanupPreviewRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: SlideshowRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: MemoryListRoute.page, guards: [_authGuard, _duplicateGuard]),
    // required to handle all deeplinks in deep_link.service.dart
    // auto_route_library#1722
    RedirectRoute(path: '*', redirectTo: '/'),
  ];
}
