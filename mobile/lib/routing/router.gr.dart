// **************************************************************************
// AutoRouteGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND

// **************************************************************************
// AutoRouteGenerator
// **************************************************************************
//
// ignore_for_file: type=lint

part of 'router.dart';

class _$AppRouter extends RootStackRouter {
  _$AppRouter({
    GlobalKey<NavigatorState>? navigatorKey,
    required this.authGuard,
    required this.duplicateGuard,
    required this.galleryPermissionGuard,
  }) : super(navigatorKey);

  final AuthGuard authGuard;

  final DuplicateGuard duplicateGuard;

  final GalleryPermissionGuard galleryPermissionGuard;

  @override
  final Map<String, PageFactory> pagesMap = {
    SplashScreenRoute.name: (routeData) {
      return MaterialPageX<dynamic>(
        routeData: routeData,
        child: const SplashScreenPage(),
      );
    },
    PermissionOnboardingRoute.name: (routeData) {
      return MaterialPageX<dynamic>(
        routeData: routeData,
        child: const PermissionOnboardingPage(),
      );
    },
    LoginRoute.name: (routeData) {
      return MaterialPageX<dynamic>(
        routeData: routeData,
        child: const LoginPage(),
      );
    },
    ChangePasswordRoute.name: (routeData) {
      return MaterialPageX<dynamic>(
        routeData: routeData,
        child: const ChangePasswordPage(),
      );
    },
    TabControllerRoute.name: (routeData) {
      return CustomPage<dynamic>(
        routeData: routeData,
        child: const TabControllerPage(),
        transitionsBuilder: TransitionsBuilders.fadeIn,
        opaque: true,
        barrierDismissible: false,
      );
    },
    GalleryViewerRoute.name: (routeData) {
      final args = routeData.argsAs<GalleryViewerRouteArgs>();
      return MaterialPageX<dynamic>(
        routeData: routeData,
        child: GalleryViewerPage(
          key: args.key,
          initialIndex: args.initialIndex,
          loadAsset: args.loadAsset,
          totalAssets: args.totalAssets,
        ),
      );
    },
    VideoViewerRoute.name: (routeData) {
      final args = routeData.argsAs<VideoViewerRouteArgs>();
      return MaterialPageX<dynamic>(
        routeData: routeData,
        child: VideoViewerPage(
          key: args.key,
          asset: args.asset,
          isMotionVideo: args.isMotionVideo,
          onVideoEnded: args.onVideoEnded,
          onPlaying: args.onPlaying,
          onPaused: args.onPaused,
        ),
      );
    },
    BackupControllerRoute.name: (routeData) {
      return MaterialPageX<dynamic>(
        routeData: routeData,
        child: const BackupControllerPage(),
      );
    },
    SearchResultRoute.name: (routeData) {
      final args = routeData.argsAs<SearchResultRouteArgs>();
      return MaterialPageX<dynamic>(
        routeData: routeData,
        child: SearchResultPage(
          key: args.key,
          searchTerm: args.searchTerm,
        ),
      );
    },
    CuratedLocationRoute.name: (routeData) {
      return MaterialPageX<dynamic>(
        routeData: routeData,
        child: const CuratedLocationPage(),
      );
    },
    CuratedObjectRoute.name: (routeData) {
      return MaterialPageX<dynamic>(
        routeData: routeData,
        child: const CuratedObjectPage(),
      );
    },
    CreateAlbumRoute.name: (routeData) {
      final args = routeData.argsAs<CreateAlbumRouteArgs>();
      return MaterialPageX<dynamic>(
        routeData: routeData,
        child: CreateAlbumPage(
          key: args.key,
          isSharedAlbum: args.isSharedAlbum,
          initialAssets: args.initialAssets,
        ),
      );
    },
    FavoritesRoute.name: (routeData) {
      return MaterialPageX<dynamic>(
        routeData: routeData,
        child: const FavoritesPage(),
      );
    },
    AllVideosRoute.name: (routeData) {
      return MaterialPageX<dynamic>(
        routeData: routeData,
        child: const AllVideosPage(),
      );
    },
    AllMotionPhotosRoute.name: (routeData) {
      return MaterialPageX<dynamic>(
        routeData: routeData,
        child: const AllMotionPhotosPage(),
      );
    },
    RecentlyAddedRoute.name: (routeData) {
      return MaterialPageX<dynamic>(
        routeData: routeData,
        child: const RecentlyAddedPage(),
      );
    },
    AssetSelectionRoute.name: (routeData) {
      final args = routeData.argsAs<AssetSelectionRouteArgs>();
      return CustomPage<AssetSelectionPageResult?>(
        routeData: routeData,
        child: AssetSelectionPage(
          key: args.key,
          existingAssets: args.existingAssets,
          isNewAlbum: args.isNewAlbum,
        ),
        transitionsBuilder: TransitionsBuilders.slideBottom,
        opaque: true,
        barrierDismissible: false,
      );
    },
    SelectUserForSharingRoute.name: (routeData) {
      final args = routeData.argsAs<SelectUserForSharingRouteArgs>();
      return CustomPage<List<String>>(
        routeData: routeData,
        child: SelectUserForSharingPage(
          key: args.key,
          assets: args.assets,
        ),
        transitionsBuilder: TransitionsBuilders.slideBottom,
        opaque: true,
        barrierDismissible: false,
      );
    },
    AlbumViewerRoute.name: (routeData) {
      final args = routeData.argsAs<AlbumViewerRouteArgs>();
      return MaterialPageX<dynamic>(
        routeData: routeData,
        child: AlbumViewerPage(
          key: args.key,
          albumId: args.albumId,
        ),
      );
    },
    SelectAdditionalUserForSharingRoute.name: (routeData) {
      final args = routeData.argsAs<SelectAdditionalUserForSharingRouteArgs>();
      return CustomPage<List<String>?>(
        routeData: routeData,
        child: SelectAdditionalUserForSharingPage(
          key: args.key,
          album: args.album,
        ),
        transitionsBuilder: TransitionsBuilders.slideBottom,
        opaque: true,
        barrierDismissible: false,
      );
    },
    BackupAlbumSelectionRoute.name: (routeData) {
      return MaterialPageX<dynamic>(
        routeData: routeData,
        child: const BackupAlbumSelectionPage(),
      );
    },
    AlbumPreviewRoute.name: (routeData) {
      final args = routeData.argsAs<AlbumPreviewRouteArgs>();
      return MaterialPageX<dynamic>(
        routeData: routeData,
        child: AlbumPreviewPage(
          key: args.key,
          album: args.album,
        ),
      );
    },
    FailedBackupStatusRoute.name: (routeData) {
      return CustomPage<dynamic>(
        routeData: routeData,
        child: const FailedBackupStatusPage(),
        transitionsBuilder: TransitionsBuilders.slideBottom,
        opaque: true,
        barrierDismissible: false,
      );
    },
    SettingsRoute.name: (routeData) {
      return MaterialPageX<dynamic>(
        routeData: routeData,
        child: const SettingsPage(),
      );
    },
    AppLogRoute.name: (routeData) {
      return CustomPage<dynamic>(
        routeData: routeData,
        child: const AppLogPage(),
        transitionsBuilder: TransitionsBuilders.slideBottom,
        opaque: true,
        barrierDismissible: false,
      );
    },
    AppLogDetailRoute.name: (routeData) {
      final args = routeData.argsAs<AppLogDetailRouteArgs>();
      return MaterialPageX<dynamic>(
        routeData: routeData,
        child: AppLogDetailPage(
          key: args.key,
          logMessage: args.logMessage,
        ),
      );
    },
    ArchiveRoute.name: (routeData) {
      return MaterialPageX<dynamic>(
        routeData: routeData,
        child: const ArchivePage(),
      );
    },
    PartnerRoute.name: (routeData) {
      return MaterialPageX<dynamic>(
        routeData: routeData,
        child: const PartnerPage(),
      );
    },
    PartnerDetailRoute.name: (routeData) {
      final args = routeData.argsAs<PartnerDetailRouteArgs>();
      return MaterialPageX<dynamic>(
        routeData: routeData,
        child: PartnerDetailPage(
          key: args.key,
          partner: args.partner,
        ),
      );
    },
    HomeRoute.name: (routeData) {
      return MaterialPageX<dynamic>(
        routeData: routeData,
        child: const HomePage(),
      );
    },
    SearchRoute.name: (routeData) {
      final args = routeData.argsAs<SearchRouteArgs>(
          orElse: () => const SearchRouteArgs());
      return MaterialPageX<dynamic>(
        routeData: routeData,
        child: SearchPage(key: args.key),
      );
    },
    SharingRoute.name: (routeData) {
      return MaterialPageX<dynamic>(
        routeData: routeData,
        child: const SharingPage(),
      );
    },
    LibraryRoute.name: (routeData) {
      return MaterialPageX<dynamic>(
        routeData: routeData,
        child: const LibraryPage(),
      );
    },
  };

  @override
  List<RouteConfig> get routes => [
        RouteConfig(
          SplashScreenRoute.name,
          path: '/',
        ),
        RouteConfig(
          PermissionOnboardingRoute.name,
          path: '/permission-onboarding-page',
          guards: [
            authGuard,
            duplicateGuard,
          ],
        ),
        RouteConfig(
          LoginRoute.name,
          path: '/login-page',
          guards: [duplicateGuard],
        ),
        RouteConfig(
          ChangePasswordRoute.name,
          path: '/change-password-page',
        ),
        RouteConfig(
          TabControllerRoute.name,
          path: '/tab-controller-page',
          guards: [
            authGuard,
            duplicateGuard,
            galleryPermissionGuard,
          ],
          children: [
            RouteConfig(
              HomeRoute.name,
              path: 'home-page',
              parent: TabControllerRoute.name,
              guards: [
                authGuard,
                duplicateGuard,
              ],
            ),
            RouteConfig(
              SearchRoute.name,
              path: 'search-page',
              parent: TabControllerRoute.name,
              guards: [
                authGuard,
                duplicateGuard,
              ],
            ),
            RouteConfig(
              SharingRoute.name,
              path: 'sharing-page',
              parent: TabControllerRoute.name,
              guards: [
                authGuard,
                duplicateGuard,
              ],
            ),
            RouteConfig(
              LibraryRoute.name,
              path: 'library-page',
              parent: TabControllerRoute.name,
              guards: [
                authGuard,
                duplicateGuard,
              ],
            ),
          ],
        ),
        RouteConfig(
          GalleryViewerRoute.name,
          path: '/gallery-viewer-page',
          guards: [
            authGuard,
            duplicateGuard,
            galleryPermissionGuard,
          ],
        ),
        RouteConfig(
          VideoViewerRoute.name,
          path: '/video-viewer-page',
          guards: [
            authGuard,
            duplicateGuard,
          ],
        ),
        RouteConfig(
          BackupControllerRoute.name,
          path: '/backup-controller-page',
          guards: [
            authGuard,
            duplicateGuard,
          ],
        ),
        RouteConfig(
          SearchResultRoute.name,
          path: '/search-result-page',
          guards: [
            authGuard,
            duplicateGuard,
          ],
        ),
        RouteConfig(
          CuratedLocationRoute.name,
          path: '/curated-location-page',
          guards: [
            authGuard,
            duplicateGuard,
          ],
        ),
        RouteConfig(
          CuratedObjectRoute.name,
          path: '/curated-object-page',
          guards: [
            authGuard,
            duplicateGuard,
          ],
        ),
        RouteConfig(
          CreateAlbumRoute.name,
          path: '/create-album-page',
          guards: [
            authGuard,
            duplicateGuard,
          ],
        ),
        RouteConfig(
          FavoritesRoute.name,
          path: '/favorites-page',
          guards: [
            authGuard,
            duplicateGuard,
          ],
        ),
        RouteConfig(
          AllVideosRoute.name,
          path: '/all-videos-page',
          guards: [
            authGuard,
            duplicateGuard,
          ],
        ),
        RouteConfig(
          AllMotionPhotosRoute.name,
          path: '/all-motion-photos-page',
          guards: [
            authGuard,
            duplicateGuard,
          ],
        ),
        RouteConfig(
          RecentlyAddedRoute.name,
          path: '/recently-added-page',
          guards: [
            authGuard,
            duplicateGuard,
          ],
        ),
        RouteConfig(
          AssetSelectionRoute.name,
          path: '/asset-selection-page',
          guards: [
            authGuard,
            duplicateGuard,
          ],
        ),
        RouteConfig(
          SelectUserForSharingRoute.name,
          path: '/select-user-for-sharing-page',
          guards: [
            authGuard,
            duplicateGuard,
          ],
        ),
        RouteConfig(
          AlbumViewerRoute.name,
          path: '/album-viewer-page',
          guards: [
            authGuard,
            duplicateGuard,
          ],
        ),
        RouteConfig(
          SelectAdditionalUserForSharingRoute.name,
          path: '/select-additional-user-for-sharing-page',
          guards: [
            authGuard,
            duplicateGuard,
          ],
        ),
        RouteConfig(
          BackupAlbumSelectionRoute.name,
          path: '/backup-album-selection-page',
          guards: [
            authGuard,
            duplicateGuard,
          ],
        ),
        RouteConfig(
          AlbumPreviewRoute.name,
          path: '/album-preview-page',
          guards: [
            authGuard,
            duplicateGuard,
          ],
        ),
        RouteConfig(
          FailedBackupStatusRoute.name,
          path: '/failed-backup-status-page',
          guards: [
            authGuard,
            duplicateGuard,
          ],
        ),
        RouteConfig(
          SettingsRoute.name,
          path: '/settings-page',
          guards: [
            authGuard,
            duplicateGuard,
          ],
        ),
        RouteConfig(
          AppLogRoute.name,
          path: '/app-log-page',
        ),
        RouteConfig(
          AppLogDetailRoute.name,
          path: '/app-log-detail-page',
        ),
        RouteConfig(
          ArchiveRoute.name,
          path: '/archive-page',
          guards: [
            authGuard,
            duplicateGuard,
          ],
        ),
        RouteConfig(
          PartnerRoute.name,
          path: '/partner-page',
          guards: [
            authGuard,
            duplicateGuard,
          ],
        ),
        RouteConfig(
          PartnerDetailRoute.name,
          path: '/partner-detail-page',
          guards: [
            authGuard,
            duplicateGuard,
          ],
        ),
      ];
}

/// generated route for
/// [SplashScreenPage]
class SplashScreenRoute extends PageRouteInfo<void> {
  const SplashScreenRoute()
      : super(
          SplashScreenRoute.name,
          path: '/',
        );

  static const String name = 'SplashScreenRoute';
}

/// generated route for
/// [PermissionOnboardingPage]
class PermissionOnboardingRoute extends PageRouteInfo<void> {
  const PermissionOnboardingRoute()
      : super(
          PermissionOnboardingRoute.name,
          path: '/permission-onboarding-page',
        );

  static const String name = 'PermissionOnboardingRoute';
}

/// generated route for
/// [LoginPage]
class LoginRoute extends PageRouteInfo<void> {
  const LoginRoute()
      : super(
          LoginRoute.name,
          path: '/login-page',
        );

  static const String name = 'LoginRoute';
}

/// generated route for
/// [ChangePasswordPage]
class ChangePasswordRoute extends PageRouteInfo<void> {
  const ChangePasswordRoute()
      : super(
          ChangePasswordRoute.name,
          path: '/change-password-page',
        );

  static const String name = 'ChangePasswordRoute';
}

/// generated route for
/// [TabControllerPage]
class TabControllerRoute extends PageRouteInfo<void> {
  const TabControllerRoute({List<PageRouteInfo>? children})
      : super(
          TabControllerRoute.name,
          path: '/tab-controller-page',
          initialChildren: children,
        );

  static const String name = 'TabControllerRoute';
}

/// generated route for
/// [GalleryViewerPage]
class GalleryViewerRoute extends PageRouteInfo<GalleryViewerRouteArgs> {
  GalleryViewerRoute({
    Key? key,
    required int initialIndex,
    required Asset Function(int) loadAsset,
    required int totalAssets,
  }) : super(
          GalleryViewerRoute.name,
          path: '/gallery-viewer-page',
          args: GalleryViewerRouteArgs(
            key: key,
            initialIndex: initialIndex,
            loadAsset: loadAsset,
            totalAssets: totalAssets,
          ),
        );

  static const String name = 'GalleryViewerRoute';
}

class GalleryViewerRouteArgs {
  const GalleryViewerRouteArgs({
    this.key,
    required this.initialIndex,
    required this.loadAsset,
    required this.totalAssets,
  });

  final Key? key;

  final int initialIndex;

  final Asset Function(int) loadAsset;

  final int totalAssets;

  @override
  String toString() {
    return 'GalleryViewerRouteArgs{key: $key, initialIndex: $initialIndex, loadAsset: $loadAsset, totalAssets: $totalAssets}';
  }
}

/// generated route for
/// [VideoViewerPage]
class VideoViewerRoute extends PageRouteInfo<VideoViewerRouteArgs> {
  VideoViewerRoute({
    Key? key,
    required Asset asset,
    required bool isMotionVideo,
    required dynamic onVideoEnded,
    dynamic onPlaying,
    dynamic onPaused,
  }) : super(
          VideoViewerRoute.name,
          path: '/video-viewer-page',
          args: VideoViewerRouteArgs(
            key: key,
            asset: asset,
            isMotionVideo: isMotionVideo,
            onVideoEnded: onVideoEnded,
            onPlaying: onPlaying,
            onPaused: onPaused,
          ),
        );

  static const String name = 'VideoViewerRoute';
}

class VideoViewerRouteArgs {
  const VideoViewerRouteArgs({
    this.key,
    required this.asset,
    required this.isMotionVideo,
    required this.onVideoEnded,
    this.onPlaying,
    this.onPaused,
  });

  final Key? key;

  final Asset asset;

  final bool isMotionVideo;

  final dynamic onVideoEnded;

  final dynamic onPlaying;

  final dynamic onPaused;

  @override
  String toString() {
    return 'VideoViewerRouteArgs{key: $key, asset: $asset, isMotionVideo: $isMotionVideo, onVideoEnded: $onVideoEnded, onPlaying: $onPlaying, onPaused: $onPaused}';
  }
}

/// generated route for
/// [BackupControllerPage]
class BackupControllerRoute extends PageRouteInfo<void> {
  const BackupControllerRoute()
      : super(
          BackupControllerRoute.name,
          path: '/backup-controller-page',
        );

  static const String name = 'BackupControllerRoute';
}

/// generated route for
/// [SearchResultPage]
class SearchResultRoute extends PageRouteInfo<SearchResultRouteArgs> {
  SearchResultRoute({
    Key? key,
    required String searchTerm,
  }) : super(
          SearchResultRoute.name,
          path: '/search-result-page',
          args: SearchResultRouteArgs(
            key: key,
            searchTerm: searchTerm,
          ),
        );

  static const String name = 'SearchResultRoute';
}

class SearchResultRouteArgs {
  const SearchResultRouteArgs({
    this.key,
    required this.searchTerm,
  });

  final Key? key;

  final String searchTerm;

  @override
  String toString() {
    return 'SearchResultRouteArgs{key: $key, searchTerm: $searchTerm}';
  }
}

/// generated route for
/// [CuratedLocationPage]
class CuratedLocationRoute extends PageRouteInfo<void> {
  const CuratedLocationRoute()
      : super(
          CuratedLocationRoute.name,
          path: '/curated-location-page',
        );

  static const String name = 'CuratedLocationRoute';
}

/// generated route for
/// [CuratedObjectPage]
class CuratedObjectRoute extends PageRouteInfo<void> {
  const CuratedObjectRoute()
      : super(
          CuratedObjectRoute.name,
          path: '/curated-object-page',
        );

  static const String name = 'CuratedObjectRoute';
}

/// generated route for
/// [CreateAlbumPage]
class CreateAlbumRoute extends PageRouteInfo<CreateAlbumRouteArgs> {
  CreateAlbumRoute({
    Key? key,
    required bool isSharedAlbum,
    List<Asset>? initialAssets,
  }) : super(
          CreateAlbumRoute.name,
          path: '/create-album-page',
          args: CreateAlbumRouteArgs(
            key: key,
            isSharedAlbum: isSharedAlbum,
            initialAssets: initialAssets,
          ),
        );

  static const String name = 'CreateAlbumRoute';
}

class CreateAlbumRouteArgs {
  const CreateAlbumRouteArgs({
    this.key,
    required this.isSharedAlbum,
    this.initialAssets,
  });

  final Key? key;

  final bool isSharedAlbum;

  final List<Asset>? initialAssets;

  @override
  String toString() {
    return 'CreateAlbumRouteArgs{key: $key, isSharedAlbum: $isSharedAlbum, initialAssets: $initialAssets}';
  }
}

/// generated route for
/// [FavoritesPage]
class FavoritesRoute extends PageRouteInfo<void> {
  const FavoritesRoute()
      : super(
          FavoritesRoute.name,
          path: '/favorites-page',
        );

  static const String name = 'FavoritesRoute';
}

/// generated route for
/// [AllVideosPage]
class AllVideosRoute extends PageRouteInfo<void> {
  const AllVideosRoute()
      : super(
          AllVideosRoute.name,
          path: '/all-videos-page',
        );

  static const String name = 'AllVideosRoute';
}

/// generated route for
/// [AllMotionPhotosPage]
class AllMotionPhotosRoute extends PageRouteInfo<void> {
  const AllMotionPhotosRoute()
      : super(
          AllMotionPhotosRoute.name,
          path: '/all-motion-photos-page',
        );

  static const String name = 'AllMotionPhotosRoute';
}

/// generated route for
/// [RecentlyAddedPage]
class RecentlyAddedRoute extends PageRouteInfo<void> {
  const RecentlyAddedRoute()
      : super(
          RecentlyAddedRoute.name,
          path: '/recently-added-page',
        );

  static const String name = 'RecentlyAddedRoute';
}

/// generated route for
/// [AssetSelectionPage]
class AssetSelectionRoute extends PageRouteInfo<AssetSelectionRouteArgs> {
  AssetSelectionRoute({
    Key? key,
    required Set<Asset> existingAssets,
    bool isNewAlbum = false,
  }) : super(
          AssetSelectionRoute.name,
          path: '/asset-selection-page',
          args: AssetSelectionRouteArgs(
            key: key,
            existingAssets: existingAssets,
            isNewAlbum: isNewAlbum,
          ),
        );

  static const String name = 'AssetSelectionRoute';
}

class AssetSelectionRouteArgs {
  const AssetSelectionRouteArgs({
    this.key,
    required this.existingAssets,
    this.isNewAlbum = false,
  });

  final Key? key;

  final Set<Asset> existingAssets;

  final bool isNewAlbum;

  @override
  String toString() {
    return 'AssetSelectionRouteArgs{key: $key, existingAssets: $existingAssets, isNewAlbum: $isNewAlbum}';
  }
}

/// generated route for
/// [SelectUserForSharingPage]
class SelectUserForSharingRoute
    extends PageRouteInfo<SelectUserForSharingRouteArgs> {
  SelectUserForSharingRoute({
    Key? key,
    required Set<Asset> assets,
  }) : super(
          SelectUserForSharingRoute.name,
          path: '/select-user-for-sharing-page',
          args: SelectUserForSharingRouteArgs(
            key: key,
            assets: assets,
          ),
        );

  static const String name = 'SelectUserForSharingRoute';
}

class SelectUserForSharingRouteArgs {
  const SelectUserForSharingRouteArgs({
    this.key,
    required this.assets,
  });

  final Key? key;

  final Set<Asset> assets;

  @override
  String toString() {
    return 'SelectUserForSharingRouteArgs{key: $key, assets: $assets}';
  }
}

/// generated route for
/// [AlbumViewerPage]
class AlbumViewerRoute extends PageRouteInfo<AlbumViewerRouteArgs> {
  AlbumViewerRoute({
    Key? key,
    required int albumId,
  }) : super(
          AlbumViewerRoute.name,
          path: '/album-viewer-page',
          args: AlbumViewerRouteArgs(
            key: key,
            albumId: albumId,
          ),
        );

  static const String name = 'AlbumViewerRoute';
}

class AlbumViewerRouteArgs {
  const AlbumViewerRouteArgs({
    this.key,
    required this.albumId,
  });

  final Key? key;

  final int albumId;

  @override
  String toString() {
    return 'AlbumViewerRouteArgs{key: $key, albumId: $albumId}';
  }
}

/// generated route for
/// [SelectAdditionalUserForSharingPage]
class SelectAdditionalUserForSharingRoute
    extends PageRouteInfo<SelectAdditionalUserForSharingRouteArgs> {
  SelectAdditionalUserForSharingRoute({
    Key? key,
    required Album album,
  }) : super(
          SelectAdditionalUserForSharingRoute.name,
          path: '/select-additional-user-for-sharing-page',
          args: SelectAdditionalUserForSharingRouteArgs(
            key: key,
            album: album,
          ),
        );

  static const String name = 'SelectAdditionalUserForSharingRoute';
}

class SelectAdditionalUserForSharingRouteArgs {
  const SelectAdditionalUserForSharingRouteArgs({
    this.key,
    required this.album,
  });

  final Key? key;

  final Album album;

  @override
  String toString() {
    return 'SelectAdditionalUserForSharingRouteArgs{key: $key, album: $album}';
  }
}

/// generated route for
/// [BackupAlbumSelectionPage]
class BackupAlbumSelectionRoute extends PageRouteInfo<void> {
  const BackupAlbumSelectionRoute()
      : super(
          BackupAlbumSelectionRoute.name,
          path: '/backup-album-selection-page',
        );

  static const String name = 'BackupAlbumSelectionRoute';
}

/// generated route for
/// [AlbumPreviewPage]
class AlbumPreviewRoute extends PageRouteInfo<AlbumPreviewRouteArgs> {
  AlbumPreviewRoute({
    Key? key,
    required AssetPathEntity album,
  }) : super(
          AlbumPreviewRoute.name,
          path: '/album-preview-page',
          args: AlbumPreviewRouteArgs(
            key: key,
            album: album,
          ),
        );

  static const String name = 'AlbumPreviewRoute';
}

class AlbumPreviewRouteArgs {
  const AlbumPreviewRouteArgs({
    this.key,
    required this.album,
  });

  final Key? key;

  final AssetPathEntity album;

  @override
  String toString() {
    return 'AlbumPreviewRouteArgs{key: $key, album: $album}';
  }
}

/// generated route for
/// [FailedBackupStatusPage]
class FailedBackupStatusRoute extends PageRouteInfo<void> {
  const FailedBackupStatusRoute()
      : super(
          FailedBackupStatusRoute.name,
          path: '/failed-backup-status-page',
        );

  static const String name = 'FailedBackupStatusRoute';
}

/// generated route for
/// [SettingsPage]
class SettingsRoute extends PageRouteInfo<void> {
  const SettingsRoute()
      : super(
          SettingsRoute.name,
          path: '/settings-page',
        );

  static const String name = 'SettingsRoute';
}

/// generated route for
/// [AppLogPage]
class AppLogRoute extends PageRouteInfo<void> {
  const AppLogRoute()
      : super(
          AppLogRoute.name,
          path: '/app-log-page',
        );

  static const String name = 'AppLogRoute';
}

/// generated route for
/// [AppLogDetailPage]
class AppLogDetailRoute extends PageRouteInfo<AppLogDetailRouteArgs> {
  AppLogDetailRoute({
    Key? key,
    required LoggerMessage logMessage,
  }) : super(
          AppLogDetailRoute.name,
          path: '/app-log-detail-page',
          args: AppLogDetailRouteArgs(
            key: key,
            logMessage: logMessage,
          ),
        );

  static const String name = 'AppLogDetailRoute';
}

class AppLogDetailRouteArgs {
  const AppLogDetailRouteArgs({
    this.key,
    required this.logMessage,
  });

  final Key? key;

  final LoggerMessage logMessage;

  @override
  String toString() {
    return 'AppLogDetailRouteArgs{key: $key, logMessage: $logMessage}';
  }
}

/// generated route for
/// [ArchivePage]
class ArchiveRoute extends PageRouteInfo<void> {
  const ArchiveRoute()
      : super(
          ArchiveRoute.name,
          path: '/archive-page',
        );

  static const String name = 'ArchiveRoute';
}

/// generated route for
/// [PartnerPage]
class PartnerRoute extends PageRouteInfo<void> {
  const PartnerRoute()
      : super(
          PartnerRoute.name,
          path: '/partner-page',
        );

  static const String name = 'PartnerRoute';
}

/// generated route for
/// [PartnerDetailPage]
class PartnerDetailRoute extends PageRouteInfo<PartnerDetailRouteArgs> {
  PartnerDetailRoute({
    Key? key,
    required User partner,
  }) : super(
          PartnerDetailRoute.name,
          path: '/partner-detail-page',
          args: PartnerDetailRouteArgs(
            key: key,
            partner: partner,
          ),
        );

  static const String name = 'PartnerDetailRoute';
}

class PartnerDetailRouteArgs {
  const PartnerDetailRouteArgs({
    this.key,
    required this.partner,
  });

  final Key? key;

  final User partner;

  @override
  String toString() {
    return 'PartnerDetailRouteArgs{key: $key, partner: $partner}';
  }
}

/// generated route for
/// [HomePage]
class HomeRoute extends PageRouteInfo<void> {
  const HomeRoute()
      : super(
          HomeRoute.name,
          path: 'home-page',
        );

  static const String name = 'HomeRoute';
}

/// generated route for
/// [SearchPage]
class SearchRoute extends PageRouteInfo<SearchRouteArgs> {
  SearchRoute({Key? key})
      : super(
          SearchRoute.name,
          path: 'search-page',
          args: SearchRouteArgs(key: key),
        );

  static const String name = 'SearchRoute';
}

class SearchRouteArgs {
  const SearchRouteArgs({this.key});

  final Key? key;

  @override
  String toString() {
    return 'SearchRouteArgs{key: $key}';
  }
}

/// generated route for
/// [SharingPage]
class SharingRoute extends PageRouteInfo<void> {
  const SharingRoute()
      : super(
          SharingRoute.name,
          path: 'sharing-page',
        );

  static const String name = 'SharingRoute';
}

/// generated route for
/// [LibraryPage]
class LibraryRoute extends PageRouteInfo<void> {
  const LibraryRoute()
      : super(
          LibraryRoute.name,
          path: 'library-page',
        );

  static const String name = 'LibraryRoute';
}
