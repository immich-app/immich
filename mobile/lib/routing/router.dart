import 'package:flutter/material.dart';
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

/// Caches and Exposes a [GoRouter]
final routerProvider = Provider<GoRouter>((ref) {
  final router = RouterNotifier(ref);

  return GoRouter(
    initialLocation: '/splash',
    debugLogDiagnostics: true, // For demo purposes
    refreshListenable: router, // This notifiies `GoRouter` for refresh events
    redirect: router._redirectLogic, // All the logic is centralized here
    routes: router._routes, // All the routes can be found there
  );
});

/// My favorite approach: ofc there's room for improvement, but it works fine.
/// What I like about this is that `RouterNotifier` centralizes all the logic.
/// The reason we use `ChangeNotifier` is because it's a `Listenable` object,
/// as required by `GoRouter`'s `refreshListenable` parameter.
/// Unluckily, it is not possible to use a `StateNotifier` here, since it's
/// not a `Listenable`. Recall that `StateNotifier` is to be preferred over
/// `ChangeNotifier`, see https://riverpod.dev/docs/concepts/providers/#different-types-of-providers
/// There are other approaches to solve this, and they can
/// be found in the `/others` folder.
class RouterNotifier extends ChangeNotifier {
  final Ref _ref;
  late bool isAuthenticated;

  /// This implementation exploits `ref.listen()` to add a simple callback that
  /// calls `notifyListeners()` whenever there's change onto a desider provider.
  RouterNotifier(this._ref) {
    isAuthenticated = _ref.watch(authenticationProvider).isAuthenticated;
    // _ref.listen<User?>(
    //   userProvider, // In our case, we're interested in the log in / log out events.
    //   (_, __) => notifyListeners(), // Obviously more logic can be added here
    // );
  }

  /// IMPORTANT: conceptually, we want to use `ref.read` to read providers, here.
  /// GoRouter is already aware of state changes through `refreshListenable`
  /// We don't want to trigger a rebuild of the surrounding provider.
  String? _redirectLogic(GoRouterState state) {
    final finishLoggedIn =
        state.location == '/splash' || state.location == '/login';

    if (!isAuthenticated) {
      // We're not logged in
      // So, IF we aren't in the login page, go there.
      return finishLoggedIn ? null : '/login';
    }
    // We're logged in

    // At this point, IF we're in the login page, go to the home page
    if (finishLoggedIn) return '/';

    // There's no need for a redirect at this point.
    return null;
  }

  List<GoRoute> get _routes => [
        GoRoute(
            name: "home",
            path: '/',
            redirect: (state) {
              var selectedTab = state.extra;

              if (selectedTab is HomeTab) {
                return state.namedLocation(selectedTab.name);
              }

              return state.namedLocation(HomeTab.photos.name);
            },
            routes: [
              for (var tab in HomeTab.values)
                GoRoute(
                  name: tab.name,
                  path: 'home/${tab.name}',
                  pageBuilder: (context, state) => NoTransitionPage(
                    key: state.pageKey,
                    child: HomePage(
                      selectedTab: tab,
                    ),
                  ),
                  // builder: (context, state) => HomePage(
                  //   selectedTab: tab,
                  // ),
                ),
            ]),
        GoRoute(
          name: "login",
          path: '/login',
          builder: (context, _) => const LoginPage(),
        ),
        GoRoute(
          name: "splash",
          path: '/splash',
          builder: (context, _) => const SplashScreenPage(),
        ),
        GoRoute(
          name: "changePassword",
          path: '/change-password',
          builder: (context, _) => const ChangePasswordPage(),
        ),
        GoRoute(
          //fixme
          name: "imageViewer",
          path: '/image-viewer',
          builder: (context, state) => ImageViewerPage(
            imageUrl: state.queryParams['imageUrl']!,
            heroTag: state.queryParams['heroTag']!,
            thumbnailUrl: state.queryParams['thumbnailUrl']!,
            asset: state.extra as ImmichAsset,
          ),
        ),
        GoRoute(
          name: "videoViewer",
          path: '/video-viewer',
          builder: (context, state) => VideoViewerPage(
            videoUrl: state.queryParams['videoUrl']!,
            asset: state.extra as ImmichAsset,
          ),
        ),
        GoRoute(
          name: "backupController",
          path: '/backup-controller',
          builder: (context, state) => const BackupControllerPage(),
        ),
        GoRoute(
          name: "backupAlbumSelection",
          path: '/backup-album-selectionr',
          builder: (context, state) => const BackupAlbumSelectionPage(),
        ),
        GoRoute(
          name: "albumPreview",
          path: '/album-preview',
          builder: (context, state) => AlbumPreviewPage(
            album: state.extra as AssetPathEntity,
          ),
        ),
        GoRoute(
          name: "createSharedAlbum",
          path: '/create-shared-album',
          builder: (context, state) => const CreateSharedAlbumPage(),
        ),
        GoRoute(
          name: "selectUserForSharing",
          path: '/select-user-for-sharing',
          builder: (context, state) => const SelectUserForSharingPage(),
        ),
        GoRoute(
          name: "searchResult",
          path: '/search-result',
          builder: (context, state) => SearchResultPage(
            searchTerm: state.queryParams['searchTerm'] ?? '',
          ),
        ),
        GoRoute(
          name: "assetSelection",
          path: '/asset-selection',
          builder: (context, state) => AssetSelectionPage(
            albumId: state.queryParams['albumId'] ?? '',
          ),
        ),
        GoRoute(
          name: "albumViewer",
          path: '/album-viewer',
          builder: (context, state) => AlbumViewerPage(
            albumId: state.queryParams['albumId'] ?? '',
          ),
        ),
        GoRoute(
          name: "selectAdditionalUserForSharing",
          path: '/select-additional-user-for-sharing',
          builder: (context, state) => SelectAdditionalUserForSharingPage(
            albumInfo: state.extra! as SharedAlbum,
          ),
        ),
      ];
}


// @MaterialAutoRouter(
//   replaceInRouteName: 'Page,Route',

//     AutoRoute(page: ImageViewerPage, guards: [AuthGuard]),
//     AutoRoute(page: VideoViewerPage, guards: [AuthGuard]),
//     AutoRoute(page: BackupControllerPage, guards: [AuthGuard]),
//     AutoRoute(page: SearchResultPage, guards: [AuthGuard]),
//     AutoRoute(page: CreateSharedAlbumPage, guards: [AuthGuard]),
//     CustomRoute<AssetSelectionPageResult?>(
//       page: AssetSelectionPage,
//       guards: [AuthGuard],
//       transitionsBuilder: TransitionsBuilders.slideBottom,
//     ),
//     CustomRoute<List<String>>(
//       page: SelectUserForSharingPage,
//       guards: [AuthGuard],
//       transitionsBuilder: TransitionsBuilders.slideBottom,
//     ),
//     AutoRoute(page: AlbumViewerPage, guards: [AuthGuard]),
//     CustomRoute<List<String>?>(
//       page: SelectAdditionalUserForSharingPage,
//       guards: [AuthGuard],
//       transitionsBuilder: TransitionsBuilders.slideBottom,
//     ),
//     AutoRoute(page: BackupAlbumSelectionPage, guards: [AuthGuard]),
//     AutoRoute(page: AlbumPreviewPage, guards: [AuthGuard]),
//   ],
// )
// class AppRouter extends _$AppRouter {
//   AppRouter() : super(authGuard: AuthGuard());
// }
