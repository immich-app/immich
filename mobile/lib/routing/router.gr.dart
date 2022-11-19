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
  _$AppRouter(
      {GlobalKey<NavigatorState>? navigatorKey, required this.authGuard})
      : super(navigatorKey);

  final AuthGuard authGuard;

  @override
  final Map<String, PageFactory> pagesMap = {
    SplashScreenRoute.name: (routeData) {
      return MaterialPageX<dynamic>(
          routeData: routeData, child: const SplashScreenPage());
    },
    LoginRoute.name: (routeData) {
      return MaterialPageX<dynamic>(
          routeData: routeData, child: const LoginPage());
    },
    ChangePasswordRoute.name: (routeData) {
      return MaterialPageX<dynamic>(
          routeData: routeData, child: const ChangePasswordPage());
    },
    TabControllerRoute.name: (routeData) {
      return CustomPage<dynamic>(
          routeData: routeData,
          child: const TabControllerPage(),
          transitionsBuilder: TransitionsBuilders.fadeIn,
          opaque: true,
          barrierDismissible: false);
    },
    GalleryViewerRoute.name: (routeData) {
      final args = routeData.argsAs<GalleryViewerRouteArgs>();
      return MaterialPageX<dynamic>(
          routeData: routeData,
          child: GalleryViewerPage(
              key: args.key, assetList: args.assetList, asset: args.asset));
    },
    ImageViewerRoute.name: (routeData) {
      final args = routeData.argsAs<ImageViewerRouteArgs>();
      return MaterialPageX<dynamic>(
          routeData: routeData,
          child: ImageViewerPage(
              key: args.key,
              heroTag: args.heroTag,
              asset: args.asset,
              authToken: args.authToken,
              isZoomedFunction: args.isZoomedFunction,
              isZoomedListener: args.isZoomedListener,
              threeStageLoading: args.threeStageLoading));
    },
    VideoViewerRoute.name: (routeData) {
      final args = routeData.argsAs<VideoViewerRouteArgs>();
      return MaterialPageX<dynamic>(
          routeData: routeData,
          child: VideoViewerPage(
              key: args.key,
              asset: args.asset,
              isMotionVideo: args.isMotionVideo,
              onVideoEnded: args.onVideoEnded));
    },
    BackupControllerRoute.name: (routeData) {
      return MaterialPageX<dynamic>(
          routeData: routeData, child: const BackupControllerPage());
    },
    SearchResultRoute.name: (routeData) {
      final args = routeData.argsAs<SearchResultRouteArgs>();
      return MaterialPageX<dynamic>(
          routeData: routeData,
          child: SearchResultPage(key: args.key, searchTerm: args.searchTerm));
    },
    CreateAlbumRoute.name: (routeData) {
      final args = routeData.argsAs<CreateAlbumRouteArgs>();
      return MaterialPageX<dynamic>(
          routeData: routeData,
          child: CreateAlbumPage(
              key: args.key, isSharedAlbum: args.isSharedAlbum));
    },
    AssetSelectionRoute.name: (routeData) {
      return CustomPage<AssetSelectionPageResult?>(
          routeData: routeData,
          child: const AssetSelectionPage(),
          transitionsBuilder: TransitionsBuilders.slideBottom,
          opaque: true,
          barrierDismissible: false);
    },
    SelectUserForSharingRoute.name: (routeData) {
      return CustomPage<List<String>>(
          routeData: routeData,
          child: const SelectUserForSharingPage(),
          transitionsBuilder: TransitionsBuilders.slideBottom,
          opaque: true,
          barrierDismissible: false);
    },
    AlbumViewerRoute.name: (routeData) {
      final args = routeData.argsAs<AlbumViewerRouteArgs>();
      return MaterialPageX<dynamic>(
          routeData: routeData,
          child: AlbumViewerPage(key: args.key, albumId: args.albumId));
    },
    SelectAdditionalUserForSharingRoute.name: (routeData) {
      final args = routeData.argsAs<SelectAdditionalUserForSharingRouteArgs>();
      return CustomPage<List<String>?>(
          routeData: routeData,
          child: SelectAdditionalUserForSharingPage(
              key: args.key, albumInfo: args.albumInfo),
          transitionsBuilder: TransitionsBuilders.slideBottom,
          opaque: true,
          barrierDismissible: false);
    },
    BackupAlbumSelectionRoute.name: (routeData) {
      return MaterialPageX<dynamic>(
          routeData: routeData, child: const BackupAlbumSelectionPage());
    },
    AlbumPreviewRoute.name: (routeData) {
      final args = routeData.argsAs<AlbumPreviewRouteArgs>();
      return MaterialPageX<dynamic>(
          routeData: routeData,
          child: AlbumPreviewPage(key: args.key, album: args.album));
    },
    FailedBackupStatusRoute.name: (routeData) {
      return CustomPage<dynamic>(
          routeData: routeData,
          child: const FailedBackupStatusPage(),
          transitionsBuilder: TransitionsBuilders.slideBottom,
          opaque: true,
          barrierDismissible: false);
    },
    SettingsRoute.name: (routeData) {
      return MaterialPageX<dynamic>(
          routeData: routeData, child: const SettingsPage());
    },
    HomeRoute.name: (routeData) {
      return MaterialPageX<dynamic>(
          routeData: routeData, child: const HomePage());
    },
    SearchRoute.name: (routeData) {
      final args = routeData.argsAs<SearchRouteArgs>(
          orElse: () => const SearchRouteArgs());
      return MaterialPageX<dynamic>(
          routeData: routeData, child: SearchPage(key: args.key));
    },
    SharingRoute.name: (routeData) {
      return MaterialPageX<dynamic>(
          routeData: routeData, child: const SharingPage());
    },
    LibraryRoute.name: (routeData) {
      return MaterialPageX<dynamic>(
          routeData: routeData, child: const LibraryPage());
    }
  };

  @override
  List<RouteConfig> get routes => [
        RouteConfig(SplashScreenRoute.name, path: '/'),
        RouteConfig(LoginRoute.name, path: '/login-page'),
        RouteConfig(ChangePasswordRoute.name, path: '/change-password-page'),
        RouteConfig(TabControllerRoute.name,
            path: '/tab-controller-page',
            guards: [
              authGuard
            ],
            children: [
              RouteConfig(HomeRoute.name,
                  path: 'home-page',
                  parent: TabControllerRoute.name,
                  guards: [authGuard]),
              RouteConfig(SearchRoute.name,
                  path: 'search-page',
                  parent: TabControllerRoute.name,
                  guards: [authGuard]),
              RouteConfig(SharingRoute.name,
                  path: 'sharing-page',
                  parent: TabControllerRoute.name,
                  guards: [authGuard]),
              RouteConfig(LibraryRoute.name,
                  path: 'library-page',
                  parent: TabControllerRoute.name,
                  guards: [authGuard])
            ]),
        RouteConfig(GalleryViewerRoute.name,
            path: '/gallery-viewer-page', guards: [authGuard]),
        RouteConfig(ImageViewerRoute.name,
            path: '/image-viewer-page', guards: [authGuard]),
        RouteConfig(VideoViewerRoute.name,
            path: '/video-viewer-page', guards: [authGuard]),
        RouteConfig(BackupControllerRoute.name,
            path: '/backup-controller-page', guards: [authGuard]),
        RouteConfig(SearchResultRoute.name,
            path: '/search-result-page', guards: [authGuard]),
        RouteConfig(CreateAlbumRoute.name,
            path: '/create-album-page', guards: [authGuard]),
        RouteConfig(AssetSelectionRoute.name,
            path: '/asset-selection-page', guards: [authGuard]),
        RouteConfig(SelectUserForSharingRoute.name,
            path: '/select-user-for-sharing-page', guards: [authGuard]),
        RouteConfig(AlbumViewerRoute.name,
            path: '/album-viewer-page', guards: [authGuard]),
        RouteConfig(SelectAdditionalUserForSharingRoute.name,
            path: '/select-additional-user-for-sharing-page',
            guards: [authGuard]),
        RouteConfig(BackupAlbumSelectionRoute.name,
            path: '/backup-album-selection-page', guards: [authGuard]),
        RouteConfig(AlbumPreviewRoute.name,
            path: '/album-preview-page', guards: [authGuard]),
        RouteConfig(FailedBackupStatusRoute.name,
            path: '/failed-backup-status-page', guards: [authGuard]),
        RouteConfig(SettingsRoute.name,
            path: '/settings-page', guards: [authGuard])
      ];
}

/// generated route for
/// [SplashScreenPage]
class SplashScreenRoute extends PageRouteInfo<void> {
  const SplashScreenRoute() : super(SplashScreenRoute.name, path: '/');

  static const String name = 'SplashScreenRoute';
}

/// generated route for
/// [LoginPage]
class LoginRoute extends PageRouteInfo<void> {
  const LoginRoute() : super(LoginRoute.name, path: '/login-page');

  static const String name = 'LoginRoute';
}

/// generated route for
/// [ChangePasswordPage]
class ChangePasswordRoute extends PageRouteInfo<void> {
  const ChangePasswordRoute()
      : super(ChangePasswordRoute.name, path: '/change-password-page');

  static const String name = 'ChangePasswordRoute';
}

/// generated route for
/// [TabControllerPage]
class TabControllerRoute extends PageRouteInfo<void> {
  const TabControllerRoute({List<PageRouteInfo>? children})
      : super(TabControllerRoute.name,
            path: '/tab-controller-page', initialChildren: children);

  static const String name = 'TabControllerRoute';
}

/// generated route for
/// [GalleryViewerPage]
class GalleryViewerRoute extends PageRouteInfo<GalleryViewerRouteArgs> {
  GalleryViewerRoute(
      {Key? key, required List<Asset> assetList, required Asset asset})
      : super(GalleryViewerRoute.name,
            path: '/gallery-viewer-page',
            args: GalleryViewerRouteArgs(
                key: key, assetList: assetList, asset: asset));

  static const String name = 'GalleryViewerRoute';
}

class GalleryViewerRouteArgs {
  const GalleryViewerRouteArgs(
      {this.key, required this.assetList, required this.asset});

  final Key? key;

  final List<Asset> assetList;

  final Asset asset;

  @override
  String toString() {
    return 'GalleryViewerRouteArgs{key: $key, assetList: $assetList, asset: $asset}';
  }
}

/// generated route for
/// [ImageViewerPage]
class ImageViewerRoute extends PageRouteInfo<ImageViewerRouteArgs> {
  ImageViewerRoute(
      {Key? key,
      required String heroTag,
      required Asset asset,
      required String authToken,
      required void Function() isZoomedFunction,
      required ValueNotifier<bool> isZoomedListener,
      required bool threeStageLoading})
      : super(ImageViewerRoute.name,
            path: '/image-viewer-page',
            args: ImageViewerRouteArgs(
                key: key,
                heroTag: heroTag,
                asset: asset,
                authToken: authToken,
                isZoomedFunction: isZoomedFunction,
                isZoomedListener: isZoomedListener,
                threeStageLoading: threeStageLoading));

  static const String name = 'ImageViewerRoute';
}

class ImageViewerRouteArgs {
  const ImageViewerRouteArgs(
      {this.key,
      required this.heroTag,
      required this.asset,
      required this.authToken,
      required this.isZoomedFunction,
      required this.isZoomedListener,
      required this.threeStageLoading});

  final Key? key;

  final String heroTag;

  final Asset asset;

  final String authToken;

  final void Function() isZoomedFunction;

  final ValueNotifier<bool> isZoomedListener;

  final bool threeStageLoading;

  @override
  String toString() {
    return 'ImageViewerRouteArgs{key: $key, heroTag: $heroTag, asset: $asset, authToken: $authToken, isZoomedFunction: $isZoomedFunction, isZoomedListener: $isZoomedListener, threeStageLoading: $threeStageLoading}';
  }
}

/// generated route for
/// [VideoViewerPage]
class VideoViewerRoute extends PageRouteInfo<VideoViewerRouteArgs> {
  VideoViewerRoute(
      {Key? key,
      required Asset asset,
      required bool isMotionVideo,
      required void Function() onVideoEnded})
      : super(VideoViewerRoute.name,
            path: '/video-viewer-page',
            args: VideoViewerRouteArgs(
                key: key,
                asset: asset,
                isMotionVideo: isMotionVideo,
                onVideoEnded: onVideoEnded));

  static const String name = 'VideoViewerRoute';
}

class VideoViewerRouteArgs {
  const VideoViewerRouteArgs(
      {this.key,
      required this.asset,
      required this.isMotionVideo,
      required this.onVideoEnded});

  final Key? key;

  final Asset asset;

  final bool isMotionVideo;

  final void Function() onVideoEnded;

  @override
  String toString() {
    return 'VideoViewerRouteArgs{key: $key, asset: $asset, isMotionVideo: $isMotionVideo, onVideoEnded: $onVideoEnded}';
  }
}

/// generated route for
/// [BackupControllerPage]
class BackupControllerRoute extends PageRouteInfo<void> {
  const BackupControllerRoute()
      : super(BackupControllerRoute.name, path: '/backup-controller-page');

  static const String name = 'BackupControllerRoute';
}

/// generated route for
/// [SearchResultPage]
class SearchResultRoute extends PageRouteInfo<SearchResultRouteArgs> {
  SearchResultRoute({Key? key, required String searchTerm})
      : super(SearchResultRoute.name,
            path: '/search-result-page',
            args: SearchResultRouteArgs(key: key, searchTerm: searchTerm));

  static const String name = 'SearchResultRoute';
}

class SearchResultRouteArgs {
  const SearchResultRouteArgs({this.key, required this.searchTerm});

  final Key? key;

  final String searchTerm;

  @override
  String toString() {
    return 'SearchResultRouteArgs{key: $key, searchTerm: $searchTerm}';
  }
}

/// generated route for
/// [CreateAlbumPage]
class CreateAlbumRoute extends PageRouteInfo<CreateAlbumRouteArgs> {
  CreateAlbumRoute({Key? key, required bool isSharedAlbum})
      : super(CreateAlbumRoute.name,
            path: '/create-album-page',
            args: CreateAlbumRouteArgs(key: key, isSharedAlbum: isSharedAlbum));

  static const String name = 'CreateAlbumRoute';
}

class CreateAlbumRouteArgs {
  const CreateAlbumRouteArgs({this.key, required this.isSharedAlbum});

  final Key? key;

  final bool isSharedAlbum;

  @override
  String toString() {
    return 'CreateAlbumRouteArgs{key: $key, isSharedAlbum: $isSharedAlbum}';
  }
}

/// generated route for
/// [AssetSelectionPage]
class AssetSelectionRoute extends PageRouteInfo<void> {
  const AssetSelectionRoute()
      : super(AssetSelectionRoute.name, path: '/asset-selection-page');

  static const String name = 'AssetSelectionRoute';
}

/// generated route for
/// [SelectUserForSharingPage]
class SelectUserForSharingRoute extends PageRouteInfo<void> {
  const SelectUserForSharingRoute()
      : super(SelectUserForSharingRoute.name,
            path: '/select-user-for-sharing-page');

  static const String name = 'SelectUserForSharingRoute';
}

/// generated route for
/// [AlbumViewerPage]
class AlbumViewerRoute extends PageRouteInfo<AlbumViewerRouteArgs> {
  AlbumViewerRoute({Key? key, required String albumId})
      : super(AlbumViewerRoute.name,
            path: '/album-viewer-page',
            args: AlbumViewerRouteArgs(key: key, albumId: albumId));

  static const String name = 'AlbumViewerRoute';
}

class AlbumViewerRouteArgs {
  const AlbumViewerRouteArgs({this.key, required this.albumId});

  final Key? key;

  final String albumId;

  @override
  String toString() {
    return 'AlbumViewerRouteArgs{key: $key, albumId: $albumId}';
  }
}

/// generated route for
/// [SelectAdditionalUserForSharingPage]
class SelectAdditionalUserForSharingRoute
    extends PageRouteInfo<SelectAdditionalUserForSharingRouteArgs> {
  SelectAdditionalUserForSharingRoute(
      {Key? key, required AlbumResponseDto albumInfo})
      : super(SelectAdditionalUserForSharingRoute.name,
            path: '/select-additional-user-for-sharing-page',
            args: SelectAdditionalUserForSharingRouteArgs(
                key: key, albumInfo: albumInfo));

  static const String name = 'SelectAdditionalUserForSharingRoute';
}

class SelectAdditionalUserForSharingRouteArgs {
  const SelectAdditionalUserForSharingRouteArgs(
      {this.key, required this.albumInfo});

  final Key? key;

  final AlbumResponseDto albumInfo;

  @override
  String toString() {
    return 'SelectAdditionalUserForSharingRouteArgs{key: $key, albumInfo: $albumInfo}';
  }
}

/// generated route for
/// [BackupAlbumSelectionPage]
class BackupAlbumSelectionRoute extends PageRouteInfo<void> {
  const BackupAlbumSelectionRoute()
      : super(BackupAlbumSelectionRoute.name,
            path: '/backup-album-selection-page');

  static const String name = 'BackupAlbumSelectionRoute';
}

/// generated route for
/// [AlbumPreviewPage]
class AlbumPreviewRoute extends PageRouteInfo<AlbumPreviewRouteArgs> {
  AlbumPreviewRoute({Key? key, required AssetPathEntity album})
      : super(AlbumPreviewRoute.name,
            path: '/album-preview-page',
            args: AlbumPreviewRouteArgs(key: key, album: album));

  static const String name = 'AlbumPreviewRoute';
}

class AlbumPreviewRouteArgs {
  const AlbumPreviewRouteArgs({this.key, required this.album});

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
      : super(FailedBackupStatusRoute.name, path: '/failed-backup-status-page');

  static const String name = 'FailedBackupStatusRoute';
}

/// generated route for
/// [SettingsPage]
class SettingsRoute extends PageRouteInfo<void> {
  const SettingsRoute() : super(SettingsRoute.name, path: '/settings-page');

  static const String name = 'SettingsRoute';
}

/// generated route for
/// [HomePage]
class HomeRoute extends PageRouteInfo<void> {
  const HomeRoute() : super(HomeRoute.name, path: 'home-page');

  static const String name = 'HomeRoute';
}

/// generated route for
/// [SearchPage]
class SearchRoute extends PageRouteInfo<SearchRouteArgs> {
  SearchRoute({Key? key})
      : super(SearchRoute.name,
            path: 'search-page', args: SearchRouteArgs(key: key));

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
  const SharingRoute() : super(SharingRoute.name, path: 'sharing-page');

  static const String name = 'SharingRoute';
}

/// generated route for
/// [LibraryPage]
class LibraryRoute extends PageRouteInfo<void> {
  const LibraryRoute() : super(LibraryRoute.name, path: 'library-page');

  static const String name = 'LibraryRoute';
}
