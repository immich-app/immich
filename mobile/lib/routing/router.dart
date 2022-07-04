import 'package:flutter/foundation.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/asset_viewer/views/image_viewer_page.dart';
import 'package:immich_mobile/modules/asset_viewer/views/video_viewer_page.dart';
import 'package:immich_mobile/modules/backup/views/album_preview_page.dart';
import 'package:immich_mobile/modules/backup/views/backup_album_selection_page.dart';
import 'package:immich_mobile/modules/backup/views/backup_controller_page.dart';
import 'package:immich_mobile/modules/home/views/home_page.dart';
import 'package:immich_mobile/modules/login/providers/authentication.provider.dart';
import 'package:immich_mobile/modules/login/views/change_password_page.dart';
import 'package:immich_mobile/modules/login/views/login_page.dart';
import 'package:immich_mobile/modules/search/views/search_result_page.dart';
import 'package:immich_mobile/modules/sharing/models/shared_album.model.dart';
import 'package:immich_mobile/modules/sharing/views/album_viewer_page.dart';
import 'package:immich_mobile/modules/sharing/views/asset_selection_page.dart';
import 'package:immich_mobile/modules/sharing/views/create_shared_album_page.dart';
import 'package:immich_mobile/modules/sharing/views/select_additional_user_for_sharing_page.dart';
import 'package:immich_mobile/modules/sharing/views/select_user_for_sharing_page.dart';
import 'package:immich_mobile/shared/models/immich_asset.model.dart';
import 'package:immich_mobile/shared/views/splash_screen.dart';
import 'package:photo_manager/photo_manager.dart';

///ref: https://github.com/lucavenir/go_router_riverpod

final routerProvider = Provider<GoRouter>(
  (ref) {
    final router = RouterNotifier(ref);

    return GoRouter(
      initialLocation: '/splash',
      debugLogDiagnostics: kDebugMode,
      refreshListenable: router,
      redirect: router._redirectLogic,
      routes: router._routes,
    );
  },
);

class RouterNotifier extends ChangeNotifier {
  final Ref _ref;

  RouterNotifier(this._ref) {
    _ref.listen(
      authenticationProvider,
      (_, __) => notifyListeners(),
    );
  }

  String? _redirectLogic(GoRouterState state) {
    var isAuthenticated = _ref.read(authenticationProvider).isAuthenticated;
    final finishLoggedIn =
        state.location == '/splash' || state.location == '/login';

    if (!isAuthenticated) return finishLoggedIn ? null : '/login';

    if (finishLoggedIn) return '/';

    return null;
  }

  List<GoRoute> get _routes => [
        GoRoute(
          name: 'home',
          path: '/',
          redirect: (state) {
            var selectedTab = state.extra;

            return selectedTab is HomeTab
                ? state.namedLocation(selectedTab.name)
                : state.namedLocation(HomeTab.photos.name);
          },
          routes: [
            for (var tab in HomeTab.values)
              GoRoute(
                name: tab.name,
                path: tab.name,
                pageBuilder: (_, state) => NoTransitionPage(
                  key: state.pageKey,
                  child: HomePage(
                    selectedTab: tab,
                  ),
                ),
              ),
            GoRoute(
              name: 'login',
              path: 'login',
              builder: (_, __) => const LoginPage(),
            ),
            GoRoute(
              name: 'splash',
              path: 'splash',
              builder: (_, __) => const SplashScreenPage(),
            ),
            GoRoute(
              name: 'changePassword',
              path: 'change-password',
              builder: (_, __) => const ChangePasswordPage(),
            ),
            GoRoute(
              name: 'imageViewer',
              path: 'image-viewer',
              builder: (_, state) => ImageViewerPage(
                imageUrl: state.queryParams['imageUrl']!,
                heroTag: state.queryParams['heroTag']!,
                thumbnailUrl: state.queryParams['thumbnailUrl']!,
                asset: state.extra as ImmichAsset,
              ),
            ),
            GoRoute(
              name: 'videoViewer',
              path: 'video-viewer',
              builder: (_, state) => VideoViewerPage(
                videoUrl: state.queryParams['videoUrl']!,
                asset: state.extra as ImmichAsset,
              ),
            ),
            GoRoute(
              name: 'backupController',
              path: 'backup-controller',
              builder: (_, __) => const BackupControllerPage(),
            ),
            GoRoute(
              name: 'backupAlbumSelection',
              path: 'backup-album-selectionr',
              builder: (_, __) => const BackupAlbumSelectionPage(),
            ),
            GoRoute(
              name: 'albumPreview',
              path: 'album-preview',
              builder: (_, state) => AlbumPreviewPage(
                album: state.extra as AssetPathEntity,
              ),
            ),
            GoRoute(
              name: 'createSharedAlbum',
              path: 'create-shared-album',
              builder: (_, __) => const CreateSharedAlbumPage(),
            ),
            GoRoute(
              name: 'selectUserForSharing',
              path: 'select-user-for-sharing',
              builder: (_, __) => const SelectUserForSharingPage(),
            ),
            GoRoute(
              name: 'searchResult',
              path: 'search-result',
              builder: (_, state) => SearchResultPage(
                searchTerm: state.queryParams['searchTerm'] ?? '',
              ),
            ),
            GoRoute(
              name: 'assetSelection',
              path: 'asset-selection',
              builder: (_, state) => AssetSelectionPage(
                albumId: state.queryParams['albumId'] ?? '',
              ),
            ),
            GoRoute(
              name: 'albumViewer',
              path: 'album-viewer',
              builder: (_, state) => AlbumViewerPage(
                albumId: state.queryParams['albumId'] ?? '',
              ),
            ),
            GoRoute(
              name: 'selectAdditionalUserForSharing',
              path: 'select-additional-user-for-sharing',
              builder: (_, state) => SelectAdditionalUserForSharingPage(
                albumInfo: state.extra! as SharedAlbum,
              ),
            ),
          ],
        ),
      ];
}
