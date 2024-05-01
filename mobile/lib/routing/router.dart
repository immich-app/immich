import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/activities/views/activities_page.dart';
import 'package:immich_mobile/models/albums/asset_selection_page_result.model.dart';
import 'package:immich_mobile/modules/album/views/album_options_part.dart';
import 'package:immich_mobile/modules/album/views/album_viewer_page.dart';
import 'package:immich_mobile/modules/album/views/asset_selection_page.dart';
import 'package:immich_mobile/modules/album/views/create_album_page.dart';
import 'package:immich_mobile/modules/album/views/library_page.dart';
import 'package:immich_mobile/modules/backup/views/backup_options_page.dart';
import 'package:immich_mobile/modules/map/views/map_location_picker_page.dart';
import 'package:immich_mobile/modules/map/views/map_page.dart';
import 'package:immich_mobile/models/memories/memory.model.dart';
import 'package:immich_mobile/modules/memories/views/memory_page.dart';
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
import 'package:immich_mobile/models/search/search_filter.model.dart';
import 'package:immich_mobile/modules/settings/views/settings_sub_page.dart';
import 'package:immich_mobile/modules/search/views/search_input_page.dart';
import 'package:immich_mobile/models/shared_link/shared_link.model.dart';
import 'package:immich_mobile/modules/shared_link/views/shared_link_edit_page.dart';
import 'package:immich_mobile/modules/shared_link/views/shared_link_page.dart';
import 'package:immich_mobile/modules/trash/views/trash_page.dart';
import 'package:immich_mobile/modules/search/views/all_motion_videos_page.dart';
import 'package:immich_mobile/modules/search/views/all_people_page.dart';
import 'package:immich_mobile/modules/search/views/all_videos_page.dart';
import 'package:immich_mobile/modules/search/views/all_places_page.dart';
import 'package:immich_mobile/modules/search/views/person_result_page.dart';
import 'package:immich_mobile/modules/search/views/recently_added_page.dart';
import 'package:immich_mobile/modules/search/views/search_page.dart';
import 'package:immich_mobile/modules/settings/views/settings_page.dart';
import 'package:immich_mobile/routing/auth_guard.dart';
import 'package:immich_mobile/routing/custom_transition_builders.dart';
import 'package:immich_mobile/routing/duplicate_guard.dart';
import 'package:immich_mobile/routing/backup_permission_guard.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/logger_message.entity.dart';
import 'package:immich_mobile/entities/user.entity.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:immich_mobile/shared/views/app_log_detail_page.dart';
import 'package:immich_mobile/shared/views/app_log_page.dart';
import 'package:immich_mobile/shared/views/splash_screen.dart';
import 'package:immich_mobile/shared/views/tab_controller_page.dart';
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
        AutoRoute(page: HomeRoute.page, guards: [_authGuard, _duplicateGuard]),
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
      page: AssetSelectionRoute.page,
      guards: [_authGuard, _duplicateGuard],
      transitionsBuilder: TransitionsBuilders.slideBottom,
    ),
    CustomRoute(
      page: SelectUserForSharingRoute.page,
      guards: [_authGuard, _duplicateGuard],
      transitionsBuilder: TransitionsBuilders.slideBottom,
    ),
    AutoRoute(
      page: AlbumViewerRoute.page,
      guards: [_authGuard, _duplicateGuard],
    ),
    CustomRoute(
      page: SelectAdditionalUserForSharingRoute.page,
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
