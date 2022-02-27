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
          child: VideoViewerPage(key: args.key, videoUrl: args.videoUrl));
    },
    BackupControllerRoute.name: (routeData) {
      return MaterialPageX<dynamic>(
          routeData: routeData, child: const BackupControllerPage());
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
                  guards: [authGuard])
            ]),
        RouteConfig(ImageViewerRoute.name,
            path: '/image-viewer-page', guards: [authGuard]),
        RouteConfig(VideoViewerRoute.name,
            path: '/video-viewer-page', guards: [authGuard]),
        RouteConfig(BackupControllerRoute.name,
            path: '/backup-controller-page', guards: [authGuard])
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
  VideoViewerRoute({Key? key, required String videoUrl})
      : super(VideoViewerRoute.name,
            path: '/video-viewer-page',
            args: VideoViewerRouteArgs(key: key, videoUrl: videoUrl));

  static const String name = 'VideoViewerRoute';
}

class VideoViewerRouteArgs {
  const VideoViewerRouteArgs({this.key, required this.videoUrl});

  final Key? key;

  final String videoUrl;

  @override
  String toString() {
    return 'VideoViewerRouteArgs{key: $key, videoUrl: $videoUrl}';
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
