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
    LoginRoute.name: (routeData) {
      return MaterialPageX<dynamic>(
          routeData: routeData, child: const LoginPage());
    },
    TabControllerRoute.name: (routeData) {
      return MaterialPageX<dynamic>(
          routeData: routeData, child: const TabControllerPage());
    },
    ImageViewerRoute.name: (routeData) {
      final args = routeData.argsAs<ImageViewerRouteArgs>();
      return MaterialPageX<dynamic>(
          routeData: routeData,
          child: ImageViewerPage(
              key: args.key,
              imageUrl: args.imageUrl,
              heroTag: args.heroTag,
              thumbnailUrl: args.thumbnailUrl,
              asset: args.asset));
    },
    VideoViewerRoute.name: (routeData) {
      final args = routeData.argsAs<VideoViewerRouteArgs>();
      return MaterialPageX<dynamic>(
          routeData: routeData,
          child: VideoViewerPage(
              key: args.key, videoUrl: args.videoUrl, asset: args.asset));
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
    CreateSharedAlbumRoute.name: (routeData) {
      return MaterialPageX<dynamic>(
          routeData: routeData, child: const CreateSharedAlbumPage());
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
    }
  };

  @override
  List<RouteConfig> get routes => [
        RouteConfig(LoginRoute.name, path: '/'),
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
                  guards: [authGuard])
            ]),
        RouteConfig(ImageViewerRoute.name,
            path: '/image-viewer-page', guards: [authGuard]),
        RouteConfig(VideoViewerRoute.name,
            path: '/video-viewer-page', guards: [authGuard]),
        RouteConfig(BackupControllerRoute.name,
            path: '/backup-controller-page', guards: [authGuard]),
        RouteConfig(SearchResultRoute.name,
            path: '/search-result-page', guards: [authGuard]),
        RouteConfig(CreateSharedAlbumRoute.name,
            path: '/create-shared-album-page', guards: [authGuard]),
        RouteConfig(AssetSelectionRoute.name,
            path: '/asset-selection-page', guards: [authGuard]),
        RouteConfig(SelectUserForSharingRoute.name,
            path: '/select-user-for-sharing-page', guards: [authGuard]),
        RouteConfig(AlbumViewerRoute.name,
            path: '/album-viewer-page', guards: [authGuard]),
        RouteConfig(SelectAdditionalUserForSharingRoute.name,
            path: '/select-additional-user-for-sharing-page',
            guards: [authGuard])
      ];
}

/// generated route for
/// [LoginPage]
class LoginRoute extends PageRouteInfo<void> {
  const LoginRoute() : super(LoginRoute.name, path: '/');

  static const String name = 'LoginRoute';
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
/// [ImageViewerPage]
class ImageViewerRoute extends PageRouteInfo<ImageViewerRouteArgs> {
  ImageViewerRoute(
      {Key? key,
      required String imageUrl,
      required String heroTag,
      required String thumbnailUrl,
      required ImmichAsset asset})
      : super(ImageViewerRoute.name,
            path: '/image-viewer-page',
            args: ImageViewerRouteArgs(
                key: key,
                imageUrl: imageUrl,
                heroTag: heroTag,
                thumbnailUrl: thumbnailUrl,
                asset: asset));

  static const String name = 'ImageViewerRoute';
}

class ImageViewerRouteArgs {
  const ImageViewerRouteArgs(
      {this.key,
      required this.imageUrl,
      required this.heroTag,
      required this.thumbnailUrl,
      required this.asset});

  final Key? key;

  final String imageUrl;

  final String heroTag;

  final String thumbnailUrl;

  final ImmichAsset asset;

  @override
  String toString() {
    return 'ImageViewerRouteArgs{key: $key, imageUrl: $imageUrl, heroTag: $heroTag, thumbnailUrl: $thumbnailUrl, asset: $asset}';
  }
}

/// generated route for
/// [VideoViewerPage]
class VideoViewerRoute extends PageRouteInfo<VideoViewerRouteArgs> {
  VideoViewerRoute(
      {Key? key, required String videoUrl, required ImmichAsset asset})
      : super(VideoViewerRoute.name,
            path: '/video-viewer-page',
            args: VideoViewerRouteArgs(
                key: key, videoUrl: videoUrl, asset: asset));

  static const String name = 'VideoViewerRoute';
}

class VideoViewerRouteArgs {
  const VideoViewerRouteArgs(
      {this.key, required this.videoUrl, required this.asset});

  final Key? key;

  final String videoUrl;

  final ImmichAsset asset;

  @override
  String toString() {
    return 'VideoViewerRouteArgs{key: $key, videoUrl: $videoUrl, asset: $asset}';
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
/// [CreateSharedAlbumPage]
class CreateSharedAlbumRoute extends PageRouteInfo<void> {
  const CreateSharedAlbumRoute()
      : super(CreateSharedAlbumRoute.name, path: '/create-shared-album-page');

  static const String name = 'CreateSharedAlbumRoute';
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
      {Key? key, required SharedAlbum albumInfo})
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

  final SharedAlbum albumInfo;

  @override
  String toString() {
    return 'SelectAdditionalUserForSharingRouteArgs{key: $key, albumInfo: $albumInfo}';
  }
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
