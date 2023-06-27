import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/album/models/asset_selection_page_result.model.dart';
import 'package:immich_mobile/modules/album/views/album_viewer_page.dart';
import 'package:immich_mobile/modules/album/views/asset_selection_page.dart';
import 'package:immich_mobile/modules/album/views/create_album_page.dart';
import 'package:immich_mobile/modules/album/views/library_page.dart';
import 'package:immich_mobile/modules/partner/views/partner_detail_page.dart';
import 'package:immich_mobile/modules/partner/views/partner_page.dart';
import 'package:immich_mobile/modules/album/views/select_additional_user_for_sharing_page.dart';
import 'package:immich_mobile/modules/album/views/select_user_for_sharing_page.dart';
import 'package:immich_mobile/modules/album/views/sharing_page.dart';
import 'package:immich_mobile/modules/archive/views/archive_page.dart';
import 'package:immich_mobile/modules/asset_viewer/views/gallery_viewer.dart';
import 'package:immich_mobile/modules/asset_viewer/views/video_viewer_page.dart';
import 'package:immich_mobile/modules/backup/views/album_preview_page.dart';
import 'package:immich_mobile/modules/backup/views/backup_album_selection_page.dart';
import 'package:immich_mobile/modules/backup/views/backup_controller_page.dart';
import 'package:immich_mobile/modules/backup/views/failed_backup_status_page.dart';
import 'package:immich_mobile/modules/favorite/views/favorites_page.dart';
import 'package:immich_mobile/modules/home/views/home_page.dart';
import 'package:immich_mobile/modules/login/views/change_password_page.dart';
import 'package:immich_mobile/modules/login/views/login_page.dart';
import 'package:immich_mobile/modules/onboarding/providers/gallery_permission.provider.dart';
import 'package:immich_mobile/modules/onboarding/views/permission_onboarding_page.dart';
import 'package:immich_mobile/modules/search/views/all_motion_videos_page.dart';
import 'package:immich_mobile/modules/search/views/all_people_page.dart';
import 'package:immich_mobile/modules/search/views/all_videos_page.dart';
import 'package:immich_mobile/modules/search/views/curated_location_page.dart';
import 'package:immich_mobile/modules/search/views/curated_object_page.dart';
import 'package:immich_mobile/modules/search/views/person_result_page.dart';
import 'package:immich_mobile/modules/search/views/recently_added_page.dart';
import 'package:immich_mobile/modules/search/views/search_page.dart';
import 'package:immich_mobile/modules/search/views/search_result_page.dart';
import 'package:immich_mobile/modules/settings/views/settings_page.dart';
import 'package:immich_mobile/routing/auth_guard.dart';
import 'package:immich_mobile/routing/duplicate_guard.dart';
import 'package:immich_mobile/routing/gallery_permission_guard.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/album.dart';
import 'package:immich_mobile/shared/models/logger_message.model.dart';
import 'package:immich_mobile/shared/models/user.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:immich_mobile/shared/views/app_log_detail_page.dart';
import 'package:immich_mobile/shared/views/app_log_page.dart';
import 'package:immich_mobile/shared/views/splash_screen.dart';
import 'package:immich_mobile/shared/views/tab_controller_page.dart';
import 'package:photo_manager/photo_manager.dart';

part 'router.gr.dart';

@MaterialAutoRouter(
  replaceInRouteName: 'Page,Route',
  routes: <AutoRoute>[
    AutoRoute(page: SplashScreenPage, initial: true),
    AutoRoute(
      page: PermissionOnboardingPage,
      guards: [AuthGuard, DuplicateGuard],
    ),
    AutoRoute(
      page: LoginPage,
      guards: [
        DuplicateGuard,
      ],
    ),
    AutoRoute(page: ChangePasswordPage),
    CustomRoute(
      page: TabControllerPage,
      guards: [AuthGuard, DuplicateGuard, GalleryPermissionGuard],
      children: [
        AutoRoute(page: HomePage, guards: [AuthGuard, DuplicateGuard]),
        AutoRoute(page: SearchPage, guards: [AuthGuard, DuplicateGuard]),
        AutoRoute(page: SharingPage, guards: [AuthGuard, DuplicateGuard]),
        AutoRoute(page: LibraryPage, guards: [AuthGuard, DuplicateGuard])
      ],
      transitionsBuilder: TransitionsBuilders.fadeIn,
    ),
    AutoRoute(
      page: GalleryViewerPage,
      guards: [AuthGuard, DuplicateGuard, GalleryPermissionGuard],
    ),
    AutoRoute(page: VideoViewerPage, guards: [AuthGuard, DuplicateGuard]),
    AutoRoute(page: BackupControllerPage, guards: [AuthGuard, DuplicateGuard]),
    AutoRoute(page: SearchResultPage, guards: [AuthGuard, DuplicateGuard]),
    AutoRoute(page: CuratedLocationPage, guards: [AuthGuard, DuplicateGuard]),
    AutoRoute(page: CuratedObjectPage, guards: [AuthGuard, DuplicateGuard]),
    AutoRoute(page: CreateAlbumPage, guards: [AuthGuard, DuplicateGuard]),
    AutoRoute(page: FavoritesPage, guards: [AuthGuard, DuplicateGuard]),
    AutoRoute(page: AllVideosPage, guards: [AuthGuard, DuplicateGuard]),
    AutoRoute(page: AllMotionPhotosPage, guards: [AuthGuard, DuplicateGuard]),
    AutoRoute(
      page: RecentlyAddedPage,
      guards: [AuthGuard, DuplicateGuard],
    ),
    CustomRoute<AssetSelectionPageResult?>(
      page: AssetSelectionPage,
      guards: [AuthGuard, DuplicateGuard],
      transitionsBuilder: TransitionsBuilders.slideBottom,
    ),
    CustomRoute<List<String>>(
      page: SelectUserForSharingPage,
      guards: [AuthGuard, DuplicateGuard],
      transitionsBuilder: TransitionsBuilders.slideBottom,
    ),
    AutoRoute(page: AlbumViewerPage, guards: [AuthGuard, DuplicateGuard]),
    CustomRoute<List<String>?>(
      page: SelectAdditionalUserForSharingPage,
      guards: [AuthGuard, DuplicateGuard],
      transitionsBuilder: TransitionsBuilders.slideBottom,
    ),
    AutoRoute(
      page: BackupAlbumSelectionPage,
      guards: [AuthGuard, DuplicateGuard],
    ),
    AutoRoute(page: AlbumPreviewPage, guards: [AuthGuard, DuplicateGuard]),
    CustomRoute(
      page: FailedBackupStatusPage,
      guards: [AuthGuard, DuplicateGuard],
      transitionsBuilder: TransitionsBuilders.slideBottom,
    ),
    AutoRoute(
      page: SettingsPage,
      guards: [
        AuthGuard,
        DuplicateGuard,
      ],
    ),
    CustomRoute(
      page: AppLogPage,
      transitionsBuilder: TransitionsBuilders.slideBottom,
    ),
    AutoRoute(
      page: AppLogDetailPage,
    ),
    AutoRoute(
      page: ArchivePage,
      guards: [
        AuthGuard,
        DuplicateGuard,
      ],
    ),
    AutoRoute(page: PartnerPage, guards: [AuthGuard, DuplicateGuard]),
    AutoRoute(page: PartnerDetailPage, guards: [AuthGuard, DuplicateGuard]),
    AutoRoute(
      page: PersonResultPage,
      guards: [
        AuthGuard,
        DuplicateGuard,
      ],
    ),
    AutoRoute(page: AllPeoplePage, guards: [AuthGuard, DuplicateGuard]),
  ],
)
class AppRouter extends _$AppRouter {
  // ignore: unused_field
  final ApiService _apiService;

  AppRouter(
    this._apiService,
    GalleryPermissionNotifier galleryPermissionNotifier,
  ) : super(
          authGuard: AuthGuard(_apiService),
          duplicateGuard: DuplicateGuard(),
          galleryPermissionGuard:
              GalleryPermissionGuard(galleryPermissionNotifier),
        );
}

final appRouterProvider = Provider(
  (ref) => AppRouter(
    ref.watch(apiServiceProvider),
    ref.watch(galleryPermissionNotifier.notifier),
  ),
);
