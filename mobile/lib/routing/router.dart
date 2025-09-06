import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/log.model.dart';
import 'package:immich_mobile/domain/models/memory.model.dart';
import 'package:immich_mobile/domain/models/person.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/models/folder/recursive_folder.model.dart';
import 'package:immich_mobile/models/memories/memory.model.dart';
import 'package:immich_mobile/models/search/search_filter.model.dart';
import 'package:immich_mobile/models/shared_link/shared_link.model.dart';
import 'package:immich_mobile/models/upload/share_intent_attachment.model.dart';
import 'package:immich_mobile/pages/album/album_additional_shared_user_selection.page.dart';
import 'package:immich_mobile/pages/album/album_asset_selection.page.dart';
import 'package:immich_mobile/pages/album/album_options.page.dart';
import 'package:immich_mobile/pages/album/album_shared_user_selection.page.dart';
import 'package:immich_mobile/pages/album/album_viewer.page.dart';
import 'package:immich_mobile/pages/albums/albums.page.dart';
import 'package:immich_mobile/pages/backup/album_preview.page.dart';
import 'package:immich_mobile/pages/backup/backup_album_selection.page.dart';
import 'package:immich_mobile/pages/backup/backup_controller.page.dart';
import 'package:immich_mobile/pages/backup/backup_options.page.dart';
import 'package:immich_mobile/pages/backup/drift_backup.page.dart';
import 'package:immich_mobile/pages/backup/drift_backup_album_selection.page.dart';
import 'package:immich_mobile/pages/backup/drift_backup_asset_detail.page.dart';
import 'package:immich_mobile/pages/backup/drift_backup_options.page.dart';
import 'package:immich_mobile/pages/backup/drift_upload_detail.page.dart';
import 'package:immich_mobile/pages/backup/failed_backup_status.page.dart';
import 'package:immich_mobile/pages/common/activities.page.dart';
import 'package:immich_mobile/pages/common/app_log.page.dart';
import 'package:immich_mobile/pages/common/app_log_detail.page.dart';
import 'package:immich_mobile/pages/common/change_experience.page.dart';
import 'package:immich_mobile/pages/common/create_album.page.dart';
import 'package:immich_mobile/pages/common/gallery_viewer.page.dart';
import 'package:immich_mobile/pages/common/headers_settings.page.dart';
import 'package:immich_mobile/pages/common/native_video_viewer.page.dart';
import 'package:immich_mobile/pages/common/settings.page.dart';
import 'package:immich_mobile/pages/common/splash_screen.page.dart';
import 'package:immich_mobile/pages/common/tab_controller.page.dart';
import 'package:immich_mobile/pages/common/tab_shell.page.dart';
import 'package:immich_mobile/pages/editing/crop.page.dart';
import 'package:immich_mobile/pages/editing/edit.page.dart';
import 'package:immich_mobile/pages/editing/filter.page.dart';
import 'package:immich_mobile/pages/library/archive.page.dart';
import 'package:immich_mobile/pages/library/favorite.page.dart';
import 'package:immich_mobile/pages/library/folder/folder.page.dart';
import 'package:immich_mobile/pages/library/library.page.dart';
import 'package:immich_mobile/pages/library/local_albums.page.dart';
import 'package:immich_mobile/pages/library/locked/locked.page.dart';
import 'package:immich_mobile/pages/library/locked/pin_auth.page.dart';
import 'package:immich_mobile/pages/library/partner/drift_partner.page.dart';
import 'package:immich_mobile/pages/library/partner/partner.page.dart';
import 'package:immich_mobile/pages/library/partner/partner_detail.page.dart';
import 'package:immich_mobile/pages/library/people/people_collection.page.dart';
import 'package:immich_mobile/pages/library/places/places_collection.page.dart';
import 'package:immich_mobile/pages/library/shared_link/shared_link.page.dart';
import 'package:immich_mobile/pages/library/shared_link/shared_link_edit.page.dart';
import 'package:immich_mobile/pages/library/trash.page.dart';
import 'package:immich_mobile/pages/login/change_password.page.dart';
import 'package:immich_mobile/pages/login/login.page.dart';
import 'package:immich_mobile/pages/onboarding/permission_onboarding.page.dart';
import 'package:immich_mobile/pages/photos/memory.page.dart';
import 'package:immich_mobile/pages/photos/photos.page.dart';
import 'package:immich_mobile/pages/search/all_motion_videos.page.dart';
import 'package:immich_mobile/pages/search/all_people.page.dart';
import 'package:immich_mobile/pages/search/all_places.page.dart';
import 'package:immich_mobile/pages/search/all_videos.page.dart';
import 'package:immich_mobile/pages/search/map/map.page.dart';
import 'package:immich_mobile/pages/search/map/map_location_picker.page.dart';
import 'package:immich_mobile/pages/search/person_result.page.dart';
import 'package:immich_mobile/pages/search/recently_taken.page.dart';
import 'package:immich_mobile/pages/search/search.page.dart';
import 'package:immich_mobile/pages/settings/beta_sync_settings.page.dart';
import 'package:immich_mobile/pages/share_intent/share_intent.page.dart';
import 'package:immich_mobile/presentation/pages/dev/feat_in_development.page.dart';
import 'package:immich_mobile/presentation/pages/dev/main_timeline.page.dart';
import 'package:immich_mobile/presentation/pages/dev/media_stat.page.dart';
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
import 'package:immich_mobile/presentation/pages/editing/drift_crop.page.dart';
import 'package:immich_mobile/presentation/pages/editing/drift_edit.page.dart';
import 'package:immich_mobile/presentation/pages/editing/drift_filter.page.dart';
import 'package:immich_mobile/presentation/pages/local_timeline.page.dart';
import 'package:immich_mobile/presentation/pages/search/drift_search.page.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_viewer.page.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/providers/gallery_permission.provider.dart';
import 'package:immich_mobile/routing/auth_guard.dart';
import 'package:immich_mobile/routing/backup_permission_guard.dart';
import 'package:immich_mobile/routing/custom_transition_builders.dart';
import 'package:immich_mobile/routing/duplicate_guard.dart';
import 'package:immich_mobile/routing/gallery_guard.dart';
import 'package:immich_mobile/routing/locked_guard.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/services/local_auth.service.dart';
import 'package:immich_mobile/services/secure_storage.service.dart';
import 'package:immich_mobile/widgets/asset_grid/asset_grid_data_structure.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

part 'router.gr.dart';

final appRouterProvider = Provider(
  (ref) => AppRouter(
    ref.watch(apiServiceProvider),
    ref.watch(galleryPermissionNotifier.notifier),
    ref.watch(secureStorageServiceProvider),
    ref.watch(localAuthServiceProvider),
  ),
);

@AutoRouterConfig(replaceInRouteName: 'Page,Route')
class AppRouter extends RootStackRouter {
  late final AuthGuard _authGuard;
  late final DuplicateGuard _duplicateGuard;
  late final BackupPermissionGuard _backupPermissionGuard;
  late final LockedGuard _lockedGuard;
  late final GalleryGuard _galleryGuard;

  AppRouter(
    ApiService apiService,
    GalleryPermissionNotifier galleryPermissionNotifier,
    SecureStorageService secureStorageService,
    LocalAuthService localAuthService,
  ) {
    _authGuard = AuthGuard(apiService);
    _duplicateGuard = const DuplicateGuard();
    _lockedGuard = LockedGuard(apiService, secureStorageService, localAuthService);
    _backupPermissionGuard = BackupPermissionGuard(galleryPermissionNotifier);
    _galleryGuard = const GalleryGuard();
  }

  @override
  RouteType get defaultRouteType => const RouteType.material();

  @override
  late final List<AutoRoute> routes = [
    AutoRoute(page: SplashScreenRoute.page, initial: true),
    AutoRoute(page: PermissionOnboardingRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: LoginRoute.page, guards: [_duplicateGuard]),
    AutoRoute(page: ChangePasswordRoute.page),
    AutoRoute(page: SearchRoute.page, guards: [_authGuard, _duplicateGuard], maintainState: false),
    CustomRoute(
      page: TabControllerRoute.page,
      guards: [_authGuard, _duplicateGuard],
      children: [
        AutoRoute(page: PhotosRoute.page, guards: [_authGuard, _duplicateGuard]),
        AutoRoute(page: SearchRoute.page, guards: [_authGuard, _duplicateGuard], maintainState: false),
        AutoRoute(page: LibraryRoute.page, guards: [_authGuard, _duplicateGuard]),
        AutoRoute(page: AlbumsRoute.page, guards: [_authGuard, _duplicateGuard]),
      ],
      transitionsBuilder: TransitionsBuilders.fadeIn,
    ),
    CustomRoute(
      page: TabShellRoute.page,
      guards: [_authGuard, _duplicateGuard],
      children: [
        AutoRoute(page: MainTimelineRoute.page, guards: [_authGuard, _duplicateGuard]),
        AutoRoute(page: DriftSearchRoute.page, guards: [_authGuard, _duplicateGuard], maintainState: false),
        AutoRoute(page: DriftLibraryRoute.page, guards: [_authGuard, _duplicateGuard]),
        AutoRoute(page: DriftAlbumsRoute.page, guards: [_authGuard, _duplicateGuard]),
      ],
      transitionsBuilder: TransitionsBuilders.fadeIn,
    ),
    CustomRoute(
      page: GalleryViewerRoute.page,
      guards: [_authGuard, _galleryGuard],
      transitionsBuilder: CustomTransitionsBuilders.zoomedPage,
    ),
    AutoRoute(page: BackupControllerRoute.page, guards: [_authGuard, _duplicateGuard, _backupPermissionGuard]),
    AutoRoute(page: AllPlacesRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: CreateAlbumRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: EditImageRoute.page),
    AutoRoute(page: CropImageRoute.page),
    AutoRoute(page: FilterImageRoute.page),
    CustomRoute(
      page: FavoritesRoute.page,
      guards: [_authGuard, _duplicateGuard],
      transitionsBuilder: TransitionsBuilders.slideLeft,
    ),
    AutoRoute(page: AllVideosRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: AllMotionPhotosRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: RecentlyTakenRoute.page, guards: [_authGuard, _duplicateGuard]),
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
    AutoRoute(page: AlbumViewerRoute.page, guards: [_authGuard, _duplicateGuard]),
    CustomRoute(
      page: AlbumAdditionalSharedUserSelectionRoute.page,
      guards: [_authGuard, _duplicateGuard],
      transitionsBuilder: TransitionsBuilders.slideBottom,
    ),
    AutoRoute(page: BackupAlbumSelectionRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: AlbumPreviewRoute.page, guards: [_authGuard, _duplicateGuard]),
    CustomRoute(
      page: FailedBackupStatusRoute.page,
      guards: [_authGuard, _duplicateGuard],
      transitionsBuilder: TransitionsBuilders.slideBottom,
    ),
    AutoRoute(page: SettingsRoute.page, guards: [_duplicateGuard]),
    AutoRoute(page: SettingsSubRoute.page, guards: [_duplicateGuard]),
    AutoRoute(page: AppLogRoute.page, guards: [_duplicateGuard]),
    AutoRoute(page: AppLogDetailRoute.page, guards: [_duplicateGuard]),
    CustomRoute(
      page: ArchiveRoute.page,
      guards: [_authGuard, _duplicateGuard],
      transitionsBuilder: TransitionsBuilders.slideLeft,
    ),
    CustomRoute(
      page: PartnerRoute.page,
      guards: [_authGuard, _duplicateGuard],
      transitionsBuilder: TransitionsBuilders.slideLeft,
    ),
    CustomRoute(page: FolderRoute.page, guards: [_authGuard], transitionsBuilder: TransitionsBuilders.fadeIn),
    AutoRoute(page: PartnerDetailRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: PersonResultRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: AllPeopleRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: MemoryRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: MapRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: AlbumOptionsRoute.page, guards: [_authGuard, _duplicateGuard]),
    CustomRoute(
      page: TrashRoute.page,
      guards: [_authGuard, _duplicateGuard],
      transitionsBuilder: TransitionsBuilders.slideLeft,
    ),
    CustomRoute(
      page: SharedLinkRoute.page,
      guards: [_authGuard, _duplicateGuard],
      transitionsBuilder: TransitionsBuilders.slideLeft,
    ),
    AutoRoute(page: SharedLinkEditRoute.page, guards: [_authGuard, _duplicateGuard]),
    CustomRoute(
      page: ActivitiesRoute.page,
      guards: [_authGuard, _duplicateGuard],
      transitionsBuilder: TransitionsBuilders.slideLeft,
      durationInMilliseconds: 200,
    ),
    CustomRoute(page: MapLocationPickerRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: BackupOptionsRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: HeaderSettingsRoute.page, guards: [_duplicateGuard]),
    CustomRoute(
      page: PeopleCollectionRoute.page,
      guards: [_authGuard, _duplicateGuard],
      transitionsBuilder: TransitionsBuilders.slideLeft,
    ),
    CustomRoute(
      page: AlbumsRoute.page,
      guards: [_authGuard, _duplicateGuard],
      transitionsBuilder: TransitionsBuilders.slideLeft,
    ),
    CustomRoute(
      page: LocalAlbumsRoute.page,
      guards: [_authGuard, _duplicateGuard],
      transitionsBuilder: TransitionsBuilders.slideLeft,
    ),
    CustomRoute(
      page: PlacesCollectionRoute.page,
      guards: [_authGuard, _duplicateGuard],
      transitionsBuilder: TransitionsBuilders.slideLeft,
    ),
    AutoRoute(page: NativeVideoViewerRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: ShareIntentRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: LockedRoute.page, guards: [_authGuard, _lockedGuard, _duplicateGuard]),
    AutoRoute(page: PinAuthRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: FeatInDevRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: LocalMediaSummaryRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: RemoteMediaSummaryRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: DriftBackupRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: DriftBackupAlbumSelectionRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: LocalTimelineRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: MainTimelineRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: RemoteAlbumRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(
      page: AssetViewerRoute.page,
      guards: [_authGuard, _duplicateGuard],
      type: RouteType.custom(
        customRouteBuilder: <T>(context, child, page) => PageRouteBuilder<T>(
          fullscreenDialog: page.fullscreenDialog,
          settings: page,
          pageBuilder: (_, __, ___) => child,
          opaque: false,
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
    AutoRoute(page: ChangeExperienceRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: DriftPartnerRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: DriftUploadDetailRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: BetaSyncSettingsRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: DriftPeopleCollectionRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: DriftPersonRoute.page, guards: [_authGuard]),
    AutoRoute(page: DriftBackupOptionsRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: DriftAlbumOptionsRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: DriftMapRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: DriftEditImageRoute.page),
    AutoRoute(page: DriftCropImageRoute.page),
    AutoRoute(page: DriftFilterImageRoute.page),
    AutoRoute(page: DriftActivitiesRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: DriftBackupAssetDetailRoute.page, guards: [_authGuard, _duplicateGuard]),
    AutoRoute(page: AssetTroubleshootRoute.page, guards: [_authGuard, _duplicateGuard]),
    // required to handle all deeplinks in deep_link.service.dart
    // auto_route_library#1722
    RedirectRoute(path: '*', redirectTo: '/'),
  ];
}
