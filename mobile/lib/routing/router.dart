import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/modules/backup/views/album_preview_page.dart';
import 'package:immich_mobile/modules/backup/views/backup_album_selection_page.dart';
import 'package:immich_mobile/modules/backup/views/failed_backup_status_page.dart';
import 'package:immich_mobile/modules/login/views/change_password_page.dart';
import 'package:immich_mobile/modules/login/views/login_page.dart';
import 'package:immich_mobile/modules/home/views/home_page.dart';
import 'package:immich_mobile/modules/search/views/search_page.dart';
import 'package:immich_mobile/modules/search/views/search_result_page.dart';
import 'package:immich_mobile/modules/sharing/models/asset_selection_page_result.model.dart';
import 'package:immich_mobile/modules/sharing/models/shared_album.model.dart';
import 'package:immich_mobile/modules/sharing/views/album_viewer_page.dart';
import 'package:immich_mobile/modules/sharing/views/asset_selection_page.dart';
import 'package:immich_mobile/modules/sharing/views/create_shared_album_page.dart';
import 'package:immich_mobile/modules/sharing/views/select_additional_user_for_sharing_page.dart';
import 'package:immich_mobile/modules/sharing/views/select_user_for_sharing_page.dart';
import 'package:immich_mobile/modules/sharing/views/sharing_page.dart';
import 'package:immich_mobile/routing/auth_guard.dart';
import 'package:immich_mobile/shared/models/immich_asset.model.dart';
import 'package:immich_mobile/modules/backup/views/backup_controller_page.dart';
import 'package:immich_mobile/modules/asset_viewer/views/image_viewer_page.dart';
import 'package:immich_mobile/shared/views/splash_screen.dart';
import 'package:immich_mobile/shared/views/tab_controller_page.dart';
import 'package:immich_mobile/modules/asset_viewer/views/video_viewer_page.dart';
import 'package:photo_manager/photo_manager.dart';

part 'router.gr.dart';

@MaterialAutoRouter(
  replaceInRouteName: 'Page,Route',
  routes: <AutoRoute>[
    AutoRoute(page: SplashScreenPage, initial: true),
    AutoRoute(page: LoginPage),
    AutoRoute(page: ChangePasswordPage),
    CustomRoute(
      page: TabControllerPage,
      guards: [AuthGuard],
      children: [
        AutoRoute(page: HomePage, guards: [AuthGuard]),
        AutoRoute(page: SearchPage, guards: [AuthGuard]),
        AutoRoute(page: SharingPage, guards: [AuthGuard])
      ],
      transitionsBuilder: TransitionsBuilders.fadeIn,
    ),
    AutoRoute(page: ImageViewerPage, guards: [AuthGuard]),
    AutoRoute(page: VideoViewerPage, guards: [AuthGuard]),
    AutoRoute(page: BackupControllerPage, guards: [AuthGuard]),
    AutoRoute(page: SearchResultPage, guards: [AuthGuard]),
    AutoRoute(page: CreateSharedAlbumPage, guards: [AuthGuard]),
    CustomRoute<AssetSelectionPageResult?>(
      page: AssetSelectionPage,
      guards: [AuthGuard],
      transitionsBuilder: TransitionsBuilders.slideBottom,
    ),
    CustomRoute<List<String>>(
      page: SelectUserForSharingPage,
      guards: [AuthGuard],
      transitionsBuilder: TransitionsBuilders.slideBottom,
    ),
    AutoRoute(page: AlbumViewerPage, guards: [AuthGuard]),
    CustomRoute<List<String>?>(
      page: SelectAdditionalUserForSharingPage,
      guards: [AuthGuard],
      transitionsBuilder: TransitionsBuilders.slideBottom,
    ),
    AutoRoute(page: BackupAlbumSelectionPage, guards: [AuthGuard]),
    AutoRoute(page: AlbumPreviewPage, guards: [AuthGuard]),
    CustomRoute(
      page: FailedBackupStatusPage,
      guards: [AuthGuard],
      transitionsBuilder: TransitionsBuilders.slideBottom,
    ),
  ],
)
class AppRouter extends _$AppRouter {
  AppRouter() : super(authGuard: AuthGuard());
}
