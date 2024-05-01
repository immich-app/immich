// GENERATED CODE - DO NOT MODIFY BY HAND

// **************************************************************************
// AutoRouterGenerator
// **************************************************************************

// ignore_for_file: type=lint
// coverage:ignore-file

part of 'router.dart';

abstract class _$AppRouter extends RootStackRouter {
  // ignore: unused_element
  _$AppRouter({super.navigatorKey});

  @override
  final Map<String, PageFactory> pagesMap = {
    ActivitiesRoute.name: (routeData) {
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: const ActivitiesPage(),
      );
    },
    AlbumOptionsRoute.name: (routeData) {
      final args = routeData.argsAs<AlbumOptionsRouteArgs>();
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: AlbumOptionsPage(
          key: args.key,
          album: args.album,
        ),
      );
    },
    AlbumPreviewRoute.name: (routeData) {
      final args = routeData.argsAs<AlbumPreviewRouteArgs>();
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: AlbumPreviewPage(
          key: args.key,
          album: args.album,
        ),
      );
    },
    AlbumViewerRoute.name: (routeData) {
      final args = routeData.argsAs<AlbumViewerRouteArgs>();
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: AlbumViewerPage(
          key: args.key,
          albumId: args.albumId,
        ),
      );
    },
    AllMotionPhotosRoute.name: (routeData) {
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: const AllMotionPhotosPage(),
      );
    },
    AllPeopleRoute.name: (routeData) {
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: const AllPeoplePage(),
      );
    },
    AllVideosRoute.name: (routeData) {
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: const AllVideosPage(),
      );
    },
    AppLogDetailRoute.name: (routeData) {
      final args = routeData.argsAs<AppLogDetailRouteArgs>();
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: AppLogDetailPage(
          key: args.key,
          logMessage: args.logMessage,
        ),
      );
    },
    AppLogRoute.name: (routeData) {
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: const AppLogPage(),
      );
    },
    ArchiveRoute.name: (routeData) {
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: const ArchivePage(),
      );
    },
    AssetSelectionRoute.name: (routeData) {
      final args = routeData.argsAs<AssetSelectionRouteArgs>();
      return AutoRoutePage<AssetSelectionPageResult?>(
        routeData: routeData,
        child: AssetSelectionPage(
          key: args.key,
          existingAssets: args.existingAssets,
          canDeselect: args.canDeselect,
          query: args.query,
        ),
      );
    },
    BackupAlbumSelectionRoute.name: (routeData) {
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: const BackupAlbumSelectionPage(),
      );
    },
    BackupControllerRoute.name: (routeData) {
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: const BackupControllerPage(),
      );
    },
    BackupOptionsRoute.name: (routeData) {
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: const BackupOptionsPage(),
      );
    },
    ChangePasswordRoute.name: (routeData) {
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: const ChangePasswordPage(),
      );
    },
    CreateAlbumRoute.name: (routeData) {
      final args = routeData.argsAs<CreateAlbumRouteArgs>();
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: CreateAlbumPage(
          key: args.key,
          isSharedAlbum: args.isSharedAlbum,
          initialAssets: args.initialAssets,
        ),
      );
    },
    AllPlacesRoute.name: (routeData) {
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: const AllPlacesPage(),
      );
    },
    FailedBackupStatusRoute.name: (routeData) {
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: const FailedBackupStatusPage(),
      );
    },
    FavoritesRoute.name: (routeData) {
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: const FavoritesPage(),
      );
    },
    GalleryViewerRoute.name: (routeData) {
      final args = routeData.argsAs<GalleryViewerRouteArgs>();
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: GalleryViewerPage(
          key: args.key,
          initialIndex: args.initialIndex,
          loadAsset: args.loadAsset,
          totalAssets: args.totalAssets,
          heroOffset: args.heroOffset,
          showStack: args.showStack,
        ),
      );
    },
    HomeRoute.name: (routeData) {
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: const HomePage(),
      );
    },
    LibraryRoute.name: (routeData) {
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: const LibraryPage(),
      );
    },
    LoginRoute.name: (routeData) {
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: const LoginPage(),
      );
    },
    MapLocationPickerRoute.name: (routeData) {
      final args = routeData.argsAs<MapLocationPickerRouteArgs>(
          orElse: () => const MapLocationPickerRouteArgs());
      return AutoRoutePage<LatLng?>(
        routeData: routeData,
        child: MapLocationPickerPage(
          key: args.key,
          initialLatLng: args.initialLatLng,
        ),
      );
    },
    MapRoute.name: (routeData) {
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: const MapPage(),
      );
    },
    MemoryRoute.name: (routeData) {
      final args = routeData.argsAs<MemoryRouteArgs>();
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: MemoryPage(
          memories: args.memories,
          memoryIndex: args.memoryIndex,
          key: args.key,
        ),
      );
    },
    PartnerDetailRoute.name: (routeData) {
      final args = routeData.argsAs<PartnerDetailRouteArgs>();
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: PartnerDetailPage(
          key: args.key,
          partner: args.partner,
        ),
      );
    },
    PartnerRoute.name: (routeData) {
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: const PartnerPage(),
      );
    },
    PermissionOnboardingRoute.name: (routeData) {
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: const PermissionOnboardingPage(),
      );
    },
    PersonResultRoute.name: (routeData) {
      final args = routeData.argsAs<PersonResultRouteArgs>();
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: PersonResultPage(
          key: args.key,
          personId: args.personId,
          personName: args.personName,
        ),
      );
    },
    RecentlyAddedRoute.name: (routeData) {
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: const RecentlyAddedPage(),
      );
    },
    SearchInputRoute.name: (routeData) {
      final args = routeData.argsAs<SearchInputRouteArgs>(
          orElse: () => const SearchInputRouteArgs());
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: SearchInputPage(
          key: args.key,
          prefilter: args.prefilter,
        ),
      );
    },
    SearchRoute.name: (routeData) {
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: const SearchPage(),
      );
    },
    SelectAdditionalUserForSharingRoute.name: (routeData) {
      final args = routeData.argsAs<SelectAdditionalUserForSharingRouteArgs>();
      return AutoRoutePage<List<String>?>(
        routeData: routeData,
        child: SelectAdditionalUserForSharingPage(
          key: args.key,
          album: args.album,
        ),
      );
    },
    SelectUserForSharingRoute.name: (routeData) {
      final args = routeData.argsAs<SelectUserForSharingRouteArgs>();
      return AutoRoutePage<List<String>>(
        routeData: routeData,
        child: SelectUserForSharingPage(
          key: args.key,
          assets: args.assets,
        ),
      );
    },
    SettingsRoute.name: (routeData) {
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: const SettingsPage(),
      );
    },
    SettingsSubRoute.name: (routeData) {
      final args = routeData.argsAs<SettingsSubRouteArgs>();
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: SettingsSubPage(
          args.section,
          key: args.key,
        ),
      );
    },
    SharedLinkEditRoute.name: (routeData) {
      final args = routeData.argsAs<SharedLinkEditRouteArgs>(
          orElse: () => const SharedLinkEditRouteArgs());
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: SharedLinkEditPage(
          key: args.key,
          existingLink: args.existingLink,
          assetsList: args.assetsList,
          albumId: args.albumId,
        ),
      );
    },
    SharedLinkRoute.name: (routeData) {
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: const SharedLinkPage(),
      );
    },
    SharingRoute.name: (routeData) {
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: const SharingPage(),
      );
    },
    SplashScreenRoute.name: (routeData) {
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: const SplashScreenPage(),
      );
    },
    TabControllerRoute.name: (routeData) {
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: const TabControllerPage(),
      );
    },
    TrashRoute.name: (routeData) {
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: const TrashPage(),
      );
    },
    VideoViewerRoute.name: (routeData) {
      final args = routeData.argsAs<VideoViewerRouteArgs>();
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: VideoViewerPage(
          key: args.key,
          asset: args.asset,
          isMotionVideo: args.isMotionVideo,
          placeholder: args.placeholder,
          showControls: args.showControls,
          hideControlsTimer: args.hideControlsTimer,
          showDownloadingIndicator: args.showDownloadingIndicator,
        ),
      );
    },
  };
}

/// generated route for
/// [ActivitiesPage]
class ActivitiesRoute extends PageRouteInfo<void> {
  const ActivitiesRoute({List<PageRouteInfo>? children})
      : super(
          ActivitiesRoute.name,
          initialChildren: children,
        );

  static const String name = 'ActivitiesRoute';

  static const PageInfo<void> page = PageInfo<void>(name);
}

/// generated route for
/// [AlbumOptionsPage]
class AlbumOptionsRoute extends PageRouteInfo<AlbumOptionsRouteArgs> {
  AlbumOptionsRoute({
    Key? key,
    required Album album,
    List<PageRouteInfo>? children,
  }) : super(
          AlbumOptionsRoute.name,
          args: AlbumOptionsRouteArgs(
            key: key,
            album: album,
          ),
          initialChildren: children,
        );

  static const String name = 'AlbumOptionsRoute';

  static const PageInfo<AlbumOptionsRouteArgs> page =
      PageInfo<AlbumOptionsRouteArgs>(name);
}

class AlbumOptionsRouteArgs {
  const AlbumOptionsRouteArgs({
    this.key,
    required this.album,
  });

  final Key? key;

  final Album album;

  @override
  String toString() {
    return 'AlbumOptionsRouteArgs{key: $key, album: $album}';
  }
}

/// generated route for
/// [AlbumPreviewPage]
class AlbumPreviewRoute extends PageRouteInfo<AlbumPreviewRouteArgs> {
  AlbumPreviewRoute({
    Key? key,
    required AssetPathEntity album,
    List<PageRouteInfo>? children,
  }) : super(
          AlbumPreviewRoute.name,
          args: AlbumPreviewRouteArgs(
            key: key,
            album: album,
          ),
          initialChildren: children,
        );

  static const String name = 'AlbumPreviewRoute';

  static const PageInfo<AlbumPreviewRouteArgs> page =
      PageInfo<AlbumPreviewRouteArgs>(name);
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
/// [AlbumViewerPage]
class AlbumViewerRoute extends PageRouteInfo<AlbumViewerRouteArgs> {
  AlbumViewerRoute({
    Key? key,
    required int albumId,
    List<PageRouteInfo>? children,
  }) : super(
          AlbumViewerRoute.name,
          args: AlbumViewerRouteArgs(
            key: key,
            albumId: albumId,
          ),
          initialChildren: children,
        );

  static const String name = 'AlbumViewerRoute';

  static const PageInfo<AlbumViewerRouteArgs> page =
      PageInfo<AlbumViewerRouteArgs>(name);
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
/// [AllMotionPhotosPage]
class AllMotionPhotosRoute extends PageRouteInfo<void> {
  const AllMotionPhotosRoute({List<PageRouteInfo>? children})
      : super(
          AllMotionPhotosRoute.name,
          initialChildren: children,
        );

  static const String name = 'AllMotionPhotosRoute';

  static const PageInfo<void> page = PageInfo<void>(name);
}

/// generated route for
/// [AllPeoplePage]
class AllPeopleRoute extends PageRouteInfo<void> {
  const AllPeopleRoute({List<PageRouteInfo>? children})
      : super(
          AllPeopleRoute.name,
          initialChildren: children,
        );

  static const String name = 'AllPeopleRoute';

  static const PageInfo<void> page = PageInfo<void>(name);
}

/// generated route for
/// [AllVideosPage]
class AllVideosRoute extends PageRouteInfo<void> {
  const AllVideosRoute({List<PageRouteInfo>? children})
      : super(
          AllVideosRoute.name,
          initialChildren: children,
        );

  static const String name = 'AllVideosRoute';

  static const PageInfo<void> page = PageInfo<void>(name);
}

/// generated route for
/// [AppLogDetailPage]
class AppLogDetailRoute extends PageRouteInfo<AppLogDetailRouteArgs> {
  AppLogDetailRoute({
    Key? key,
    required LoggerMessage logMessage,
    List<PageRouteInfo>? children,
  }) : super(
          AppLogDetailRoute.name,
          args: AppLogDetailRouteArgs(
            key: key,
            logMessage: logMessage,
          ),
          initialChildren: children,
        );

  static const String name = 'AppLogDetailRoute';

  static const PageInfo<AppLogDetailRouteArgs> page =
      PageInfo<AppLogDetailRouteArgs>(name);
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
/// [AppLogPage]
class AppLogRoute extends PageRouteInfo<void> {
  const AppLogRoute({List<PageRouteInfo>? children})
      : super(
          AppLogRoute.name,
          initialChildren: children,
        );

  static const String name = 'AppLogRoute';

  static const PageInfo<void> page = PageInfo<void>(name);
}

/// generated route for
/// [ArchivePage]
class ArchiveRoute extends PageRouteInfo<void> {
  const ArchiveRoute({List<PageRouteInfo>? children})
      : super(
          ArchiveRoute.name,
          initialChildren: children,
        );

  static const String name = 'ArchiveRoute';

  static const PageInfo<void> page = PageInfo<void>(name);
}

/// generated route for
/// [AssetSelectionPage]
class AssetSelectionRoute extends PageRouteInfo<AssetSelectionRouteArgs> {
  AssetSelectionRoute({
    Key? key,
    required Set<Asset> existingAssets,
    bool canDeselect = false,
    required QueryBuilder<Asset, Asset, QAfterSortBy>? query,
    List<PageRouteInfo>? children,
  }) : super(
          AssetSelectionRoute.name,
          args: AssetSelectionRouteArgs(
            key: key,
            existingAssets: existingAssets,
            canDeselect: canDeselect,
            query: query,
          ),
          initialChildren: children,
        );

  static const String name = 'AssetSelectionRoute';

  static const PageInfo<AssetSelectionRouteArgs> page =
      PageInfo<AssetSelectionRouteArgs>(name);
}

class AssetSelectionRouteArgs {
  const AssetSelectionRouteArgs({
    this.key,
    required this.existingAssets,
    this.canDeselect = false,
    required this.query,
  });

  final Key? key;

  final Set<Asset> existingAssets;

  final bool canDeselect;

  final QueryBuilder<Asset, Asset, QAfterSortBy>? query;

  @override
  String toString() {
    return 'AssetSelectionRouteArgs{key: $key, existingAssets: $existingAssets, canDeselect: $canDeselect, query: $query}';
  }
}

/// generated route for
/// [BackupAlbumSelectionPage]
class BackupAlbumSelectionRoute extends PageRouteInfo<void> {
  const BackupAlbumSelectionRoute({List<PageRouteInfo>? children})
      : super(
          BackupAlbumSelectionRoute.name,
          initialChildren: children,
        );

  static const String name = 'BackupAlbumSelectionRoute';

  static const PageInfo<void> page = PageInfo<void>(name);
}

/// generated route for
/// [BackupControllerPage]
class BackupControllerRoute extends PageRouteInfo<void> {
  const BackupControllerRoute({List<PageRouteInfo>? children})
      : super(
          BackupControllerRoute.name,
          initialChildren: children,
        );

  static const String name = 'BackupControllerRoute';

  static const PageInfo<void> page = PageInfo<void>(name);
}

/// generated route for
/// [BackupOptionsPage]
class BackupOptionsRoute extends PageRouteInfo<void> {
  const BackupOptionsRoute({List<PageRouteInfo>? children})
      : super(
          BackupOptionsRoute.name,
          initialChildren: children,
        );

  static const String name = 'BackupOptionsRoute';

  static const PageInfo<void> page = PageInfo<void>(name);
}

/// generated route for
/// [ChangePasswordPage]
class ChangePasswordRoute extends PageRouteInfo<void> {
  const ChangePasswordRoute({List<PageRouteInfo>? children})
      : super(
          ChangePasswordRoute.name,
          initialChildren: children,
        );

  static const String name = 'ChangePasswordRoute';

  static const PageInfo<void> page = PageInfo<void>(name);
}

/// generated route for
/// [CreateAlbumPage]
class CreateAlbumRoute extends PageRouteInfo<CreateAlbumRouteArgs> {
  CreateAlbumRoute({
    Key? key,
    required bool isSharedAlbum,
    List<Asset>? initialAssets,
    List<PageRouteInfo>? children,
  }) : super(
          CreateAlbumRoute.name,
          args: CreateAlbumRouteArgs(
            key: key,
            isSharedAlbum: isSharedAlbum,
            initialAssets: initialAssets,
          ),
          initialChildren: children,
        );

  static const String name = 'CreateAlbumRoute';

  static const PageInfo<CreateAlbumRouteArgs> page =
      PageInfo<CreateAlbumRouteArgs>(name);
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
/// [AllPlacesPage]
class AllPlacesRoute extends PageRouteInfo<void> {
  const AllPlacesRoute({List<PageRouteInfo>? children})
      : super(
          AllPlacesRoute.name,
          initialChildren: children,
        );

  static const String name = 'CuratedLocationRoute';

  static const PageInfo<void> page = PageInfo<void>(name);
}

/// generated route for
/// [FailedBackupStatusPage]
class FailedBackupStatusRoute extends PageRouteInfo<void> {
  const FailedBackupStatusRoute({List<PageRouteInfo>? children})
      : super(
          FailedBackupStatusRoute.name,
          initialChildren: children,
        );

  static const String name = 'FailedBackupStatusRoute';

  static const PageInfo<void> page = PageInfo<void>(name);
}

/// generated route for
/// [FavoritesPage]
class FavoritesRoute extends PageRouteInfo<void> {
  const FavoritesRoute({List<PageRouteInfo>? children})
      : super(
          FavoritesRoute.name,
          initialChildren: children,
        );

  static const String name = 'FavoritesRoute';

  static const PageInfo<void> page = PageInfo<void>(name);
}

/// generated route for
/// [GalleryViewerPage]
class GalleryViewerRoute extends PageRouteInfo<GalleryViewerRouteArgs> {
  GalleryViewerRoute({
    Key? key,
    required int initialIndex,
    required Asset Function(int) loadAsset,
    required int totalAssets,
    int heroOffset = 0,
    bool showStack = false,
    List<PageRouteInfo>? children,
  }) : super(
          GalleryViewerRoute.name,
          args: GalleryViewerRouteArgs(
            key: key,
            initialIndex: initialIndex,
            loadAsset: loadAsset,
            totalAssets: totalAssets,
            heroOffset: heroOffset,
            showStack: showStack,
          ),
          initialChildren: children,
        );

  static const String name = 'GalleryViewerRoute';

  static const PageInfo<GalleryViewerRouteArgs> page =
      PageInfo<GalleryViewerRouteArgs>(name);
}

class GalleryViewerRouteArgs {
  const GalleryViewerRouteArgs({
    this.key,
    required this.initialIndex,
    required this.loadAsset,
    required this.totalAssets,
    this.heroOffset = 0,
    this.showStack = false,
  });

  final Key? key;

  final int initialIndex;

  final Asset Function(int) loadAsset;

  final int totalAssets;

  final int heroOffset;

  final bool showStack;

  @override
  String toString() {
    return 'GalleryViewerRouteArgs{key: $key, initialIndex: $initialIndex, loadAsset: $loadAsset, totalAssets: $totalAssets, heroOffset: $heroOffset, showStack: $showStack}';
  }
}

/// generated route for
/// [HomePage]
class HomeRoute extends PageRouteInfo<void> {
  const HomeRoute({List<PageRouteInfo>? children})
      : super(
          HomeRoute.name,
          initialChildren: children,
        );

  static const String name = 'HomeRoute';

  static const PageInfo<void> page = PageInfo<void>(name);
}

/// generated route for
/// [LibraryPage]
class LibraryRoute extends PageRouteInfo<void> {
  const LibraryRoute({List<PageRouteInfo>? children})
      : super(
          LibraryRoute.name,
          initialChildren: children,
        );

  static const String name = 'LibraryRoute';

  static const PageInfo<void> page = PageInfo<void>(name);
}

/// generated route for
/// [LoginPage]
class LoginRoute extends PageRouteInfo<void> {
  const LoginRoute({List<PageRouteInfo>? children})
      : super(
          LoginRoute.name,
          initialChildren: children,
        );

  static const String name = 'LoginRoute';

  static const PageInfo<void> page = PageInfo<void>(name);
}

/// generated route for
/// [MapLocationPickerPage]
class MapLocationPickerRoute extends PageRouteInfo<MapLocationPickerRouteArgs> {
  MapLocationPickerRoute({
    Key? key,
    LatLng initialLatLng = const LatLng(0, 0),
    List<PageRouteInfo>? children,
  }) : super(
          MapLocationPickerRoute.name,
          args: MapLocationPickerRouteArgs(
            key: key,
            initialLatLng: initialLatLng,
          ),
          initialChildren: children,
        );

  static const String name = 'MapLocationPickerRoute';

  static const PageInfo<MapLocationPickerRouteArgs> page =
      PageInfo<MapLocationPickerRouteArgs>(name);
}

class MapLocationPickerRouteArgs {
  const MapLocationPickerRouteArgs({
    this.key,
    this.initialLatLng = const LatLng(0, 0),
  });

  final Key? key;

  final LatLng initialLatLng;

  @override
  String toString() {
    return 'MapLocationPickerRouteArgs{key: $key, initialLatLng: $initialLatLng}';
  }
}

/// generated route for
/// [MapPage]
class MapRoute extends PageRouteInfo<void> {
  const MapRoute({List<PageRouteInfo>? children})
      : super(
          MapRoute.name,
          initialChildren: children,
        );

  static const String name = 'MapRoute';

  static const PageInfo<void> page = PageInfo<void>(name);
}

/// generated route for
/// [MemoryPage]
class MemoryRoute extends PageRouteInfo<MemoryRouteArgs> {
  MemoryRoute({
    required List<Memory> memories,
    required int memoryIndex,
    Key? key,
    List<PageRouteInfo>? children,
  }) : super(
          MemoryRoute.name,
          args: MemoryRouteArgs(
            memories: memories,
            memoryIndex: memoryIndex,
            key: key,
          ),
          initialChildren: children,
        );

  static const String name = 'MemoryRoute';

  static const PageInfo<MemoryRouteArgs> page = PageInfo<MemoryRouteArgs>(name);
}

class MemoryRouteArgs {
  const MemoryRouteArgs({
    required this.memories,
    required this.memoryIndex,
    this.key,
  });

  final List<Memory> memories;

  final int memoryIndex;

  final Key? key;

  @override
  String toString() {
    return 'MemoryRouteArgs{memories: $memories, memoryIndex: $memoryIndex, key: $key}';
  }
}

/// generated route for
/// [PartnerDetailPage]
class PartnerDetailRoute extends PageRouteInfo<PartnerDetailRouteArgs> {
  PartnerDetailRoute({
    Key? key,
    required User partner,
    List<PageRouteInfo>? children,
  }) : super(
          PartnerDetailRoute.name,
          args: PartnerDetailRouteArgs(
            key: key,
            partner: partner,
          ),
          initialChildren: children,
        );

  static const String name = 'PartnerDetailRoute';

  static const PageInfo<PartnerDetailRouteArgs> page =
      PageInfo<PartnerDetailRouteArgs>(name);
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
/// [PartnerPage]
class PartnerRoute extends PageRouteInfo<void> {
  const PartnerRoute({List<PageRouteInfo>? children})
      : super(
          PartnerRoute.name,
          initialChildren: children,
        );

  static const String name = 'PartnerRoute';

  static const PageInfo<void> page = PageInfo<void>(name);
}

/// generated route for
/// [PermissionOnboardingPage]
class PermissionOnboardingRoute extends PageRouteInfo<void> {
  const PermissionOnboardingRoute({List<PageRouteInfo>? children})
      : super(
          PermissionOnboardingRoute.name,
          initialChildren: children,
        );

  static const String name = 'PermissionOnboardingRoute';

  static const PageInfo<void> page = PageInfo<void>(name);
}

/// generated route for
/// [PersonResultPage]
class PersonResultRoute extends PageRouteInfo<PersonResultRouteArgs> {
  PersonResultRoute({
    Key? key,
    required String personId,
    required String personName,
    List<PageRouteInfo>? children,
  }) : super(
          PersonResultRoute.name,
          args: PersonResultRouteArgs(
            key: key,
            personId: personId,
            personName: personName,
          ),
          initialChildren: children,
        );

  static const String name = 'PersonResultRoute';

  static const PageInfo<PersonResultRouteArgs> page =
      PageInfo<PersonResultRouteArgs>(name);
}

class PersonResultRouteArgs {
  const PersonResultRouteArgs({
    this.key,
    required this.personId,
    required this.personName,
  });

  final Key? key;

  final String personId;

  final String personName;

  @override
  String toString() {
    return 'PersonResultRouteArgs{key: $key, personId: $personId, personName: $personName}';
  }
}

/// generated route for
/// [RecentlyAddedPage]
class RecentlyAddedRoute extends PageRouteInfo<void> {
  const RecentlyAddedRoute({List<PageRouteInfo>? children})
      : super(
          RecentlyAddedRoute.name,
          initialChildren: children,
        );

  static const String name = 'RecentlyAddedRoute';

  static const PageInfo<void> page = PageInfo<void>(name);
}

/// generated route for
/// [SearchInputPage]
class SearchInputRoute extends PageRouteInfo<SearchInputRouteArgs> {
  SearchInputRoute({
    Key? key,
    SearchFilter? prefilter,
    List<PageRouteInfo>? children,
  }) : super(
          SearchInputRoute.name,
          args: SearchInputRouteArgs(
            key: key,
            prefilter: prefilter,
          ),
          initialChildren: children,
        );

  static const String name = 'SearchInputRoute';

  static const PageInfo<SearchInputRouteArgs> page =
      PageInfo<SearchInputRouteArgs>(name);
}

class SearchInputRouteArgs {
  const SearchInputRouteArgs({
    this.key,
    this.prefilter,
  });

  final Key? key;

  final SearchFilter? prefilter;

  @override
  String toString() {
    return 'SearchInputRouteArgs{key: $key, prefilter: $prefilter}';
  }
}

/// generated route for
/// [SearchPage]
class SearchRoute extends PageRouteInfo<void> {
  const SearchRoute({List<PageRouteInfo>? children})
      : super(
          SearchRoute.name,
          initialChildren: children,
        );

  static const String name = 'SearchRoute';

  static const PageInfo<void> page = PageInfo<void>(name);
}

/// generated route for
/// [SelectAdditionalUserForSharingPage]
class SelectAdditionalUserForSharingRoute
    extends PageRouteInfo<SelectAdditionalUserForSharingRouteArgs> {
  SelectAdditionalUserForSharingRoute({
    Key? key,
    required Album album,
    List<PageRouteInfo>? children,
  }) : super(
          SelectAdditionalUserForSharingRoute.name,
          args: SelectAdditionalUserForSharingRouteArgs(
            key: key,
            album: album,
          ),
          initialChildren: children,
        );

  static const String name = 'SelectAdditionalUserForSharingRoute';

  static const PageInfo<SelectAdditionalUserForSharingRouteArgs> page =
      PageInfo<SelectAdditionalUserForSharingRouteArgs>(name);
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
/// [SelectUserForSharingPage]
class SelectUserForSharingRoute
    extends PageRouteInfo<SelectUserForSharingRouteArgs> {
  SelectUserForSharingRoute({
    Key? key,
    required Set<Asset> assets,
    List<PageRouteInfo>? children,
  }) : super(
          SelectUserForSharingRoute.name,
          args: SelectUserForSharingRouteArgs(
            key: key,
            assets: assets,
          ),
          initialChildren: children,
        );

  static const String name = 'SelectUserForSharingRoute';

  static const PageInfo<SelectUserForSharingRouteArgs> page =
      PageInfo<SelectUserForSharingRouteArgs>(name);
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
/// [SettingsPage]
class SettingsRoute extends PageRouteInfo<void> {
  const SettingsRoute({List<PageRouteInfo>? children})
      : super(
          SettingsRoute.name,
          initialChildren: children,
        );

  static const String name = 'SettingsRoute';

  static const PageInfo<void> page = PageInfo<void>(name);
}

/// generated route for
/// [SettingsSubPage]
class SettingsSubRoute extends PageRouteInfo<SettingsSubRouteArgs> {
  SettingsSubRoute({
    required SettingSection section,
    Key? key,
    List<PageRouteInfo>? children,
  }) : super(
          SettingsSubRoute.name,
          args: SettingsSubRouteArgs(
            section: section,
            key: key,
          ),
          initialChildren: children,
        );

  static const String name = 'SettingsSubRoute';

  static const PageInfo<SettingsSubRouteArgs> page =
      PageInfo<SettingsSubRouteArgs>(name);
}

class SettingsSubRouteArgs {
  const SettingsSubRouteArgs({
    required this.section,
    this.key,
  });

  final SettingSection section;

  final Key? key;

  @override
  String toString() {
    return 'SettingsSubRouteArgs{section: $section, key: $key}';
  }
}

/// generated route for
/// [SharedLinkEditPage]
class SharedLinkEditRoute extends PageRouteInfo<SharedLinkEditRouteArgs> {
  SharedLinkEditRoute({
    Key? key,
    SharedLink? existingLink,
    List<String>? assetsList,
    String? albumId,
    List<PageRouteInfo>? children,
  }) : super(
          SharedLinkEditRoute.name,
          args: SharedLinkEditRouteArgs(
            key: key,
            existingLink: existingLink,
            assetsList: assetsList,
            albumId: albumId,
          ),
          initialChildren: children,
        );

  static const String name = 'SharedLinkEditRoute';

  static const PageInfo<SharedLinkEditRouteArgs> page =
      PageInfo<SharedLinkEditRouteArgs>(name);
}

class SharedLinkEditRouteArgs {
  const SharedLinkEditRouteArgs({
    this.key,
    this.existingLink,
    this.assetsList,
    this.albumId,
  });

  final Key? key;

  final SharedLink? existingLink;

  final List<String>? assetsList;

  final String? albumId;

  @override
  String toString() {
    return 'SharedLinkEditRouteArgs{key: $key, existingLink: $existingLink, assetsList: $assetsList, albumId: $albumId}';
  }
}

/// generated route for
/// [SharedLinkPage]
class SharedLinkRoute extends PageRouteInfo<void> {
  const SharedLinkRoute({List<PageRouteInfo>? children})
      : super(
          SharedLinkRoute.name,
          initialChildren: children,
        );

  static const String name = 'SharedLinkRoute';

  static const PageInfo<void> page = PageInfo<void>(name);
}

/// generated route for
/// [SharingPage]
class SharingRoute extends PageRouteInfo<void> {
  const SharingRoute({List<PageRouteInfo>? children})
      : super(
          SharingRoute.name,
          initialChildren: children,
        );

  static const String name = 'SharingRoute';

  static const PageInfo<void> page = PageInfo<void>(name);
}

/// generated route for
/// [SplashScreenPage]
class SplashScreenRoute extends PageRouteInfo<void> {
  const SplashScreenRoute({List<PageRouteInfo>? children})
      : super(
          SplashScreenRoute.name,
          initialChildren: children,
        );

  static const String name = 'SplashScreenRoute';

  static const PageInfo<void> page = PageInfo<void>(name);
}

/// generated route for
/// [TabControllerPage]
class TabControllerRoute extends PageRouteInfo<void> {
  const TabControllerRoute({List<PageRouteInfo>? children})
      : super(
          TabControllerRoute.name,
          initialChildren: children,
        );

  static const String name = 'TabControllerRoute';

  static const PageInfo<void> page = PageInfo<void>(name);
}

/// generated route for
/// [TrashPage]
class TrashRoute extends PageRouteInfo<void> {
  const TrashRoute({List<PageRouteInfo>? children})
      : super(
          TrashRoute.name,
          initialChildren: children,
        );

  static const String name = 'TrashRoute';

  static const PageInfo<void> page = PageInfo<void>(name);
}

/// generated route for
/// [VideoViewerPage]
class VideoViewerRoute extends PageRouteInfo<VideoViewerRouteArgs> {
  VideoViewerRoute({
    Key? key,
    required Asset asset,
    bool isMotionVideo = false,
    Widget? placeholder,
    bool showControls = true,
    Duration hideControlsTimer = const Duration(seconds: 5),
    bool showDownloadingIndicator = true,
    List<PageRouteInfo>? children,
  }) : super(
          VideoViewerRoute.name,
          args: VideoViewerRouteArgs(
            key: key,
            asset: asset,
            isMotionVideo: isMotionVideo,
            placeholder: placeholder,
            showControls: showControls,
            hideControlsTimer: hideControlsTimer,
            showDownloadingIndicator: showDownloadingIndicator,
          ),
          initialChildren: children,
        );

  static const String name = 'VideoViewerRoute';

  static const PageInfo<VideoViewerRouteArgs> page =
      PageInfo<VideoViewerRouteArgs>(name);
}

class VideoViewerRouteArgs {
  const VideoViewerRouteArgs({
    this.key,
    required this.asset,
    this.isMotionVideo = false,
    this.placeholder,
    this.showControls = true,
    this.hideControlsTimer = const Duration(seconds: 5),
    this.showDownloadingIndicator = true,
  });

  final Key? key;

  final Asset asset;

  final bool isMotionVideo;

  final Widget? placeholder;

  final bool showControls;

  final Duration hideControlsTimer;

  final bool showDownloadingIndicator;

  @override
  String toString() {
    return 'VideoViewerRouteArgs{key: $key, asset: $asset, isMotionVideo: $isMotionVideo, placeholder: $placeholder, showControls: $showControls, hideControlsTimer: $hideControlsTimer, showDownloadingIndicator: $showDownloadingIndicator}';
  }
}
