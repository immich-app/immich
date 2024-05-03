import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/memories/memory.model.dart';
import 'package:immich_mobile/models/search/search_filter.model.dart';
import 'package:immich_mobile/modules/activities/views/activities_page.dart';
import 'package:immich_mobile/models/albums/asset_selection_page_result.model.dart';
import 'package:immich_mobile/modules/album/views/album_options_part.dart';
import 'package:immich_mobile/modules/album/views/album_viewer_page.dart';
import 'package:immich_mobile/modules/album/views/album_asset_selection_page.dart';
import 'package:immich_mobile/modules/album/views/create_album_page.dart';
import 'package:immich_mobile/models/shared_link/shared_link.model.dart';
import 'package:immich_mobile/modules/album/views/album_additional_shared_user_selection_age.dart';
import 'package:immich_mobile/modules/album/views/album_shared_user_selection_page.dart';
import 'package:immich_mobile/providers/gallery_permission.provider.dart';
import 'package:immich_mobile/routing/auth_guard.dart';
import 'package:immich_mobile/routing/custom_transition_builders.dart';
import 'package:immich_mobile/routing/duplicate_guard.dart';
import 'package:immich_mobile/routing/backup_permission_guard.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/logger_message.entity.dart';
import 'package:immich_mobile/entities/user.entity.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/routing/pages/app_log_detail_page.dart';
import 'package:immich_mobile/routing/pages/app_log_page.dart';
import 'package:immich_mobile/routing/pages/backup/album_preview_page.dart';
import 'package:immich_mobile/routing/pages/backup/backup_album_selection_page.dart';
import 'package:immich_mobile/routing/pages/backup/backup_controller_page.dart';
import 'package:immich_mobile/routing/pages/backup/backup_options_page.dart';
import 'package:immich_mobile/routing/pages/backup/failed_backup_status_page.dart';
import 'package:immich_mobile/routing/pages/gallery_viewer.dart';
import 'package:immich_mobile/routing/pages/library/archive_page.dart';
import 'package:immich_mobile/routing/pages/library/favorites_page.dart';
import 'package:immich_mobile/routing/pages/library/library_page.dart';
import 'package:immich_mobile/routing/pages/library/trash_page.dart';
import 'package:immich_mobile/routing/pages/login/change_password_page.dart';
import 'package:immich_mobile/routing/pages/login/login_page.dart';
import 'package:immich_mobile/routing/pages/onboarding/permission_onboarding_page.dart';
import 'package:immich_mobile/routing/pages/photos/memory_page.dart';
import 'package:immich_mobile/routing/pages/photos/photos_page.dart';
import 'package:immich_mobile/routing/pages/search/all_motion_videos_page.dart';
import 'package:immich_mobile/routing/pages/search/all_people_page.dart';
import 'package:immich_mobile/routing/pages/search/all_places_page.dart';
import 'package:immich_mobile/routing/pages/search/all_videos_page.dart';
import 'package:immich_mobile/routing/pages/search/map/map_location_picker_page.dart';
import 'package:immich_mobile/routing/pages/search/map/map_page.dart';
import 'package:immich_mobile/routing/pages/search/person_result_page.dart';
import 'package:immich_mobile/routing/pages/search/recently_added_page.dart';
import 'package:immich_mobile/routing/pages/search/search_input_page.dart';
import 'package:immich_mobile/routing/pages/search/search_page.dart';
import 'package:immich_mobile/routing/pages/settings_page.dart';
import 'package:immich_mobile/routing/pages/settings_sub_page.dart';
import 'package:immich_mobile/routing/pages/sharing/partner/partner_detail_page.dart';
import 'package:immich_mobile/routing/pages/sharing/partner/partner_page.dart';
import 'package:immich_mobile/routing/pages/sharing/shared_link/shared_link_edit_page.dart';
import 'package:immich_mobile/routing/pages/sharing/shared_link/shared_link_page.dart';
import 'package:immich_mobile/routing/pages/sharing/sharing_page.dart';
import 'package:immich_mobile/routing/pages/splash_screen.dart';
import 'package:immich_mobile/routing/pages/tab_controller_page.dart';
import 'package:immich_mobile/routing/pages/video_viewer_page.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:isar/isar.dart';
import 'package:maplibre_gl/maplibre_gl.dart';
import 'package:photo_manager/photo_manager.dart' hide LatLng;

part 'router.gr.dart';

@AutoRouterConfig(replaceInRouteName: 'Page,Route')
class AppRouter extends _$AppRouter {
  late final AuthGuard _authGuard;
  late final DuplicateGuard _duplicateGuard;
  late final BackupPermissionGuard _backupPermissionGuard;

  AppRouter(
    ApiService apiService,
    GalleryPermissionNotifier galleryPermissionNotifier,
  ) {
    _authGuard = AuthGuard(apiService);
    _duplicateGuard = DuplicateGuard();
    _backupPermissionGuard = BackupPermissionGuard(galleryPermissionNotifier);
  }

  @override
  RouteType get defaultRouteType => const RouteType.material();

  @override
  late final List<AutoRoute> routes = [
    AutoRoute(page: SplashScreenRoute.page, initial: true),
    AutoRoute(
      page: PermissionOnboardingRoute.page,
      guards: [_authGuard, _duplicateGuard],
    ),
    AutoRoute(page: LoginRoute.page, guards: [_duplicateGuard]),
    AutoRoute(page: ChangePasswordRoute.page),
    CustomRoute(
      page: TabControllerRoute.page,
      guards: [_authGuard, _duplicateGuard],
      children: [
        AutoRoute(
          page: PhotosRoute.page,
          guards: [_authGuard, _duplicateGuard],
        ),
        AutoRoute(
          page: SearchRoute.page,
          guards: [_authGuard, _duplicateGuard],
        ),
        AutoRoute(
          page: SharingRoute.page,
          guards: [_authGuard, _duplicateGuard],
        ),
        AutoRoute(
          page: LibraryRoute.page,
          guards: [_authGuard, _duplicateGuard],
        ),
      ],
      transitionsBuilder: TransitionsBuilders.fadeIn,
    ),
    CustomRoute(
      page: GalleryViewerRoute.page,
      guards: [_authGuard, _duplicateGuard],
      transitionsBuilder: CustomTransitionsBuilders.zoomedPage,
    ),
    AutoRoute(
      page: VideoViewerRoute.page,
      guards: [_authGuard, _duplicateGuard],
    ),
    AutoRoute(
      page: BackupControllerRoute.page,
      guards: [_authGuard, _duplicateGuard, _backupPermissionGuard],
    ),
    AutoRoute(
      page: AllPlacesRoute.page,
      guards: [_authGuard, _duplicateGuard],
    ),
    AutoRoute(
      page: CreateAlbumRoute.page,
      guards: [_authGuard, _duplicateGuard],
    ),
    AutoRoute(page: FavoritesRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: AllVideosRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(
      page: AllMotionPhotosRoute.page,
      guards: [_authGuard, _duplicateGuard],
    ),
    AutoRoute(
      page: RecentlyAddedRoute.page,
      guards: [_authGuard, _duplicateGuard],
    ),
    CustomRoute(
      page: AlbumAssetSelectionRoute.page,
      guards: [_authGuard, _duplicateGuard],
      transitionsBuilder: TransitionsBuilders.slideBottom,
    ),
    CustomRoute(
      page: AlbumSharedUserSelectionRoute.page,
      guards: [_authGuard, _duplicateGuard],
      transitionsBuilder: TransitionsBuilders.slideBottom,
    ),
    AutoRoute(
      page: AlbumViewerRoute.page,
      guards: [_authGuard, _duplicateGuard],
    ),
    CustomRoute(
      page: AlbumAdditionalSharedUserSelectionRoute.page,
      guards: [_authGuard, _duplicateGuard],
      transitionsBuilder: TransitionsBuilders.slideBottom,
    ),
    AutoRoute(
      page: BackupAlbumSelectionRoute.page,
      guards: [_authGuard, _duplicateGuard],
    ),
    AutoRoute(
      page: AlbumPreviewRoute.page,
      guards: [_authGuard, _duplicateGuard],
    ),
    CustomRoute(
      page: FailedBackupStatusRoute.page,
      guards: [_authGuard, _duplicateGuard],
      transitionsBuilder: TransitionsBuilders.slideBottom,
    ),
    AutoRoute(page: SettingsRoute.page, guards: [_duplicateGuard]),
    AutoRoute(page: SettingsSubRoute.page, guards: [_duplicateGuard]),
    AutoRoute(page: AppLogRoute.page, guards: [_duplicateGuard]),
    AutoRoute(page: AppLogDetailRoute.page, guards: [_duplicateGuard]),
    AutoRoute(page: ArchiveRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: PartnerRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(
      page: PartnerDetailRoute.page,
      guards: [_authGuard, _duplicateGuard],
    ),
    AutoRoute(
      page: PersonResultRoute.page,
      guards: [_authGuard, _duplicateGuard],
    ),
    AutoRoute(page: AllPeopleRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: MemoryRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: MapRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(
      page: AlbumOptionsRoute.page,
      guards: [_authGuard, _duplicateGuard],
    ),
    AutoRoute(page: TrashRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(
      page: SharedLinkRoute.page,
      guards: [_authGuard, _duplicateGuard],
    ),
    AutoRoute(
      page: SharedLinkEditRoute.page,
      guards: [_authGuard, _duplicateGuard],
    ),
    CustomRoute(
      page: ActivitiesRoute.page,
      guards: [_authGuard, _duplicateGuard],
      transitionsBuilder: TransitionsBuilders.slideLeft,
      durationInMilliseconds: 200,
    ),
    CustomRoute(
      page: MapLocationPickerRoute.page,
      guards: [_authGuard, _duplicateGuard],
    ),
    AutoRoute(
      page: BackupOptionsRoute.page,
      guards: [_authGuard, _duplicateGuard],
    ),
    CustomRoute(
      page: SearchInputRoute.page,
      guards: [_authGuard, _duplicateGuard],
      transitionsBuilder: TransitionsBuilders.noTransition,
    ),
  ];
}

final appRouterProvider = Provider(
  (ref) => AppRouter(
    ref.watch(apiServiceProvider),
    ref.watch(galleryPermissionNotifier.notifier),
  ),
);
