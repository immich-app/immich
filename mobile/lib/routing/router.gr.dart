// dart format width=80
// GENERATED CODE - DO NOT MODIFY BY HAND

// **************************************************************************
// AutoRouterGenerator
// **************************************************************************

// ignore_for_file: type=lint
// coverage:ignore-file

part of 'router.dart';

/// generated route for
/// [AppLogDetailPage]
class AppLogDetailRoute extends PageRouteInfo<AppLogDetailRouteArgs> {
  AppLogDetailRoute({
    Key? key,
    required LogMessage logMessage,
    List<PageRouteInfo>? children,
  }) : super(
         AppLogDetailRoute.name,
         args: AppLogDetailRouteArgs(key: key, logMessage: logMessage),
         initialChildren: children,
       );

  static const String name = 'AppLogDetailRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<AppLogDetailRouteArgs>();
      return AppLogDetailPage(key: args.key, logMessage: args.logMessage);
    },
  );
}

class AppLogDetailRouteArgs {
  const AppLogDetailRouteArgs({this.key, required this.logMessage});

  final Key? key;

  final LogMessage logMessage;

  @override
  String toString() {
    return 'AppLogDetailRouteArgs{key: $key, logMessage: $logMessage}';
  }
}

/// generated route for
/// [AppLogPage]
class AppLogRoute extends PageRouteInfo<void> {
  const AppLogRoute({List<PageRouteInfo>? children})
    : super(AppLogRoute.name, initialChildren: children);

  static const String name = 'AppLogRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const AppLogPage();
    },
  );
}

/// generated route for
/// [AssetTroubleshootPage]
class AssetTroubleshootRoute extends PageRouteInfo<AssetTroubleshootRouteArgs> {
  AssetTroubleshootRoute({
    Key? key,
    required BaseAsset asset,
    List<PageRouteInfo>? children,
  }) : super(
         AssetTroubleshootRoute.name,
         args: AssetTroubleshootRouteArgs(key: key, asset: asset),
         initialChildren: children,
       );

  static const String name = 'AssetTroubleshootRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<AssetTroubleshootRouteArgs>();
      return AssetTroubleshootPage(key: args.key, asset: args.asset);
    },
  );
}

class AssetTroubleshootRouteArgs {
  const AssetTroubleshootRouteArgs({this.key, required this.asset});

  final Key? key;

  final BaseAsset asset;

  @override
  String toString() {
    return 'AssetTroubleshootRouteArgs{key: $key, asset: $asset}';
  }
}

/// generated route for
/// [AssetViewerPage]
class AssetViewerRoute extends PageRouteInfo<AssetViewerRouteArgs> {
  AssetViewerRoute({
    Key? key,
    required int initialIndex,
    required TimelineService timelineService,
    int? heroOffset,
    RemoteAlbum? currentAlbum,
    List<PageRouteInfo>? children,
  }) : super(
         AssetViewerRoute.name,
         args: AssetViewerRouteArgs(
           key: key,
           initialIndex: initialIndex,
           timelineService: timelineService,
           heroOffset: heroOffset,
           currentAlbum: currentAlbum,
         ),
         initialChildren: children,
       );

  static const String name = 'AssetViewerRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<AssetViewerRouteArgs>();
      return AssetViewerPage(
        key: args.key,
        initialIndex: args.initialIndex,
        timelineService: args.timelineService,
        heroOffset: args.heroOffset,
        currentAlbum: args.currentAlbum,
      );
    },
  );
}

class AssetViewerRouteArgs {
  const AssetViewerRouteArgs({
    this.key,
    required this.initialIndex,
    required this.timelineService,
    this.heroOffset,
    this.currentAlbum,
  });

  final Key? key;

  final int initialIndex;

  final TimelineService timelineService;

  final int? heroOffset;

  final RemoteAlbum? currentAlbum;

  @override
  String toString() {
    return 'AssetViewerRouteArgs{key: $key, initialIndex: $initialIndex, timelineService: $timelineService, heroOffset: $heroOffset, currentAlbum: $currentAlbum}';
  }
}

/// generated route for
/// [ChangePasswordPage]
class ChangePasswordRoute extends PageRouteInfo<void> {
  const ChangePasswordRoute({List<PageRouteInfo>? children})
    : super(ChangePasswordRoute.name, initialChildren: children);

  static const String name = 'ChangePasswordRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const ChangePasswordPage();
    },
  );
}

/// generated route for
/// [CleanupPreviewPage]
class CleanupPreviewRoute extends PageRouteInfo<CleanupPreviewRouteArgs> {
  CleanupPreviewRoute({
    Key? key,
    required List<LocalAsset> assets,
    List<PageRouteInfo>? children,
  }) : super(
         CleanupPreviewRoute.name,
         args: CleanupPreviewRouteArgs(key: key, assets: assets),
         initialChildren: children,
       );

  static const String name = 'CleanupPreviewRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<CleanupPreviewRouteArgs>();
      return CleanupPreviewPage(key: args.key, assets: args.assets);
    },
  );
}

class CleanupPreviewRouteArgs {
  const CleanupPreviewRouteArgs({this.key, required this.assets});

  final Key? key;

  final List<LocalAsset> assets;

  @override
  String toString() {
    return 'CleanupPreviewRouteArgs{key: $key, assets: $assets}';
  }
}

/// generated route for
/// [DownloadInfoPage]
class DownloadInfoRoute extends PageRouteInfo<void> {
  const DownloadInfoRoute({List<PageRouteInfo>? children})
    : super(DownloadInfoRoute.name, initialChildren: children);

  static const String name = 'DownloadInfoRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const DownloadInfoPage();
    },
  );
}

/// generated route for
/// [DriftActivitiesPage]
class DriftActivitiesRoute extends PageRouteInfo<DriftActivitiesRouteArgs> {
  DriftActivitiesRoute({
    Key? key,
    required RemoteAlbum album,
    String? assetId,
    String? assetName,
    List<PageRouteInfo>? children,
  }) : super(
         DriftActivitiesRoute.name,
         args: DriftActivitiesRouteArgs(
           key: key,
           album: album,
           assetId: assetId,
           assetName: assetName,
         ),
         initialChildren: children,
       );

  static const String name = 'DriftActivitiesRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<DriftActivitiesRouteArgs>();
      return DriftActivitiesPage(
        key: args.key,
        album: args.album,
        assetId: args.assetId,
        assetName: args.assetName,
      );
    },
  );
}

class DriftActivitiesRouteArgs {
  const DriftActivitiesRouteArgs({
    this.key,
    required this.album,
    this.assetId,
    this.assetName,
  });

  final Key? key;

  final RemoteAlbum album;

  final String? assetId;

  final String? assetName;

  @override
  String toString() {
    return 'DriftActivitiesRouteArgs{key: $key, album: $album, assetId: $assetId, assetName: $assetName}';
  }
}

/// generated route for
/// [DriftAlbumOptionsPage]
class DriftAlbumOptionsRoute extends PageRouteInfo<DriftAlbumOptionsRouteArgs> {
  DriftAlbumOptionsRoute({
    Key? key,
    required RemoteAlbum album,
    List<PageRouteInfo>? children,
  }) : super(
         DriftAlbumOptionsRoute.name,
         args: DriftAlbumOptionsRouteArgs(key: key, album: album),
         initialChildren: children,
       );

  static const String name = 'DriftAlbumOptionsRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<DriftAlbumOptionsRouteArgs>();
      return DriftAlbumOptionsPage(key: args.key, album: args.album);
    },
  );
}

class DriftAlbumOptionsRouteArgs {
  const DriftAlbumOptionsRouteArgs({this.key, required this.album});

  final Key? key;

  final RemoteAlbum album;

  @override
  String toString() {
    return 'DriftAlbumOptionsRouteArgs{key: $key, album: $album}';
  }
}

/// generated route for
/// [DriftAlbumsPage]
class DriftAlbumsRoute extends PageRouteInfo<void> {
  const DriftAlbumsRoute({List<PageRouteInfo>? children})
    : super(DriftAlbumsRoute.name, initialChildren: children);

  static const String name = 'DriftAlbumsRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const DriftAlbumsPage();
    },
  );
}

/// generated route for
/// [DriftArchivePage]
class DriftArchiveRoute extends PageRouteInfo<void> {
  const DriftArchiveRoute({List<PageRouteInfo>? children})
    : super(DriftArchiveRoute.name, initialChildren: children);

  static const String name = 'DriftArchiveRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const DriftArchivePage();
    },
  );
}

/// generated route for
/// [DriftAssetSelectionTimelinePage]
class DriftAssetSelectionTimelineRoute
    extends PageRouteInfo<DriftAssetSelectionTimelineRouteArgs> {
  DriftAssetSelectionTimelineRoute({
    Key? key,
    Set<BaseAsset> lockedSelectionAssets = const {},
    List<PageRouteInfo>? children,
  }) : super(
         DriftAssetSelectionTimelineRoute.name,
         args: DriftAssetSelectionTimelineRouteArgs(
           key: key,
           lockedSelectionAssets: lockedSelectionAssets,
         ),
         initialChildren: children,
       );

  static const String name = 'DriftAssetSelectionTimelineRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<DriftAssetSelectionTimelineRouteArgs>(
        orElse: () => const DriftAssetSelectionTimelineRouteArgs(),
      );
      return DriftAssetSelectionTimelinePage(
        key: args.key,
        lockedSelectionAssets: args.lockedSelectionAssets,
      );
    },
  );
}

class DriftAssetSelectionTimelineRouteArgs {
  const DriftAssetSelectionTimelineRouteArgs({
    this.key,
    this.lockedSelectionAssets = const {},
  });

  final Key? key;

  final Set<BaseAsset> lockedSelectionAssets;

  @override
  String toString() {
    return 'DriftAssetSelectionTimelineRouteArgs{key: $key, lockedSelectionAssets: $lockedSelectionAssets}';
  }
}

/// generated route for
/// [DriftBackupAlbumSelectionPage]
class DriftBackupAlbumSelectionRoute extends PageRouteInfo<void> {
  const DriftBackupAlbumSelectionRoute({List<PageRouteInfo>? children})
    : super(DriftBackupAlbumSelectionRoute.name, initialChildren: children);

  static const String name = 'DriftBackupAlbumSelectionRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const DriftBackupAlbumSelectionPage();
    },
  );
}

/// generated route for
/// [DriftBackupAssetDetailPage]
class DriftBackupAssetDetailRoute extends PageRouteInfo<void> {
  const DriftBackupAssetDetailRoute({List<PageRouteInfo>? children})
    : super(DriftBackupAssetDetailRoute.name, initialChildren: children);

  static const String name = 'DriftBackupAssetDetailRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const DriftBackupAssetDetailPage();
    },
  );
}

/// generated route for
/// [DriftBackupOptionsPage]
class DriftBackupOptionsRoute extends PageRouteInfo<void> {
  const DriftBackupOptionsRoute({List<PageRouteInfo>? children})
    : super(DriftBackupOptionsRoute.name, initialChildren: children);

  static const String name = 'DriftBackupOptionsRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const DriftBackupOptionsPage();
    },
  );
}

/// generated route for
/// [DriftBackupPage]
class DriftBackupRoute extends PageRouteInfo<void> {
  const DriftBackupRoute({List<PageRouteInfo>? children})
    : super(DriftBackupRoute.name, initialChildren: children);

  static const String name = 'DriftBackupRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const DriftBackupPage();
    },
  );
}

/// generated route for
/// [DriftCreateAlbumPage]
class DriftCreateAlbumRoute extends PageRouteInfo<void> {
  const DriftCreateAlbumRoute({List<PageRouteInfo>? children})
    : super(DriftCreateAlbumRoute.name, initialChildren: children);

  static const String name = 'DriftCreateAlbumRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const DriftCreateAlbumPage();
    },
  );
}

/// generated route for
/// [DriftEditImagePage]
class DriftEditImageRoute extends PageRouteInfo<DriftEditImageRouteArgs> {
  DriftEditImageRoute({
    Key? key,
    required Image image,
    required Future<void> Function(List<AssetEdit>) applyEdits,
    List<PageRouteInfo>? children,
  }) : super(
         DriftEditImageRoute.name,
         args: DriftEditImageRouteArgs(
           key: key,
           image: image,
           applyEdits: applyEdits,
         ),
         initialChildren: children,
       );

  static const String name = 'DriftEditImageRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<DriftEditImageRouteArgs>();
      return DriftEditImagePage(
        key: args.key,
        image: args.image,
        applyEdits: args.applyEdits,
      );
    },
  );
}

class DriftEditImageRouteArgs {
  const DriftEditImageRouteArgs({
    this.key,
    required this.image,
    required this.applyEdits,
  });

  final Key? key;

  final Image image;

  final Future<void> Function(List<AssetEdit>) applyEdits;

  @override
  String toString() {
    return 'DriftEditImageRouteArgs{key: $key, image: $image, applyEdits: $applyEdits}';
  }
}

/// generated route for
/// [DriftFavoritePage]
class DriftFavoriteRoute extends PageRouteInfo<void> {
  const DriftFavoriteRoute({List<PageRouteInfo>? children})
    : super(DriftFavoriteRoute.name, initialChildren: children);

  static const String name = 'DriftFavoriteRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const DriftFavoritePage();
    },
  );
}

/// generated route for
/// [DriftLibraryPage]
class DriftLibraryRoute extends PageRouteInfo<void> {
  const DriftLibraryRoute({List<PageRouteInfo>? children})
    : super(DriftLibraryRoute.name, initialChildren: children);

  static const String name = 'DriftLibraryRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const DriftLibraryPage();
    },
  );
}

/// generated route for
/// [DriftLocalAlbumsPage]
class DriftLocalAlbumsRoute extends PageRouteInfo<void> {
  const DriftLocalAlbumsRoute({List<PageRouteInfo>? children})
    : super(DriftLocalAlbumsRoute.name, initialChildren: children);

  static const String name = 'DriftLocalAlbumsRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const DriftLocalAlbumsPage();
    },
  );
}

/// generated route for
/// [DriftLockedFolderPage]
class DriftLockedFolderRoute extends PageRouteInfo<void> {
  const DriftLockedFolderRoute({List<PageRouteInfo>? children})
    : super(DriftLockedFolderRoute.name, initialChildren: children);

  static const String name = 'DriftLockedFolderRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const DriftLockedFolderPage();
    },
  );
}

/// generated route for
/// [DriftMapPage]
class DriftMapRoute extends PageRouteInfo<DriftMapRouteArgs> {
  DriftMapRoute({
    Key? key,
    LatLng? initialLocation,
    List<PageRouteInfo>? children,
  }) : super(
         DriftMapRoute.name,
         args: DriftMapRouteArgs(key: key, initialLocation: initialLocation),
         initialChildren: children,
       );

  static const String name = 'DriftMapRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<DriftMapRouteArgs>(
        orElse: () => const DriftMapRouteArgs(),
      );
      return DriftMapPage(key: args.key, initialLocation: args.initialLocation);
    },
  );
}

class DriftMapRouteArgs {
  const DriftMapRouteArgs({this.key, this.initialLocation});

  final Key? key;

  final LatLng? initialLocation;

  @override
  String toString() {
    return 'DriftMapRouteArgs{key: $key, initialLocation: $initialLocation}';
  }
}

/// generated route for
/// [DriftMemoryPage]
class DriftMemoryRoute extends PageRouteInfo<DriftMemoryRouteArgs> {
  DriftMemoryRoute({
    required List<DriftMemory> memories,
    required int memoryIndex,
    Key? key,
    List<PageRouteInfo>? children,
  }) : super(
         DriftMemoryRoute.name,
         args: DriftMemoryRouteArgs(
           memories: memories,
           memoryIndex: memoryIndex,
           key: key,
         ),
         initialChildren: children,
       );

  static const String name = 'DriftMemoryRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<DriftMemoryRouteArgs>();
      return DriftMemoryPage(
        memories: args.memories,
        memoryIndex: args.memoryIndex,
        key: args.key,
      );
    },
  );
}

class DriftMemoryRouteArgs {
  const DriftMemoryRouteArgs({
    required this.memories,
    required this.memoryIndex,
    this.key,
  });

  final List<DriftMemory> memories;

  final int memoryIndex;

  final Key? key;

  @override
  String toString() {
    return 'DriftMemoryRouteArgs{memories: $memories, memoryIndex: $memoryIndex, key: $key}';
  }
}

/// generated route for
/// [DriftPartnerDetailPage]
class DriftPartnerDetailRoute
    extends PageRouteInfo<DriftPartnerDetailRouteArgs> {
  DriftPartnerDetailRoute({
    Key? key,
    required PartnerUserDto partner,
    List<PageRouteInfo>? children,
  }) : super(
         DriftPartnerDetailRoute.name,
         args: DriftPartnerDetailRouteArgs(key: key, partner: partner),
         initialChildren: children,
       );

  static const String name = 'DriftPartnerDetailRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<DriftPartnerDetailRouteArgs>();
      return DriftPartnerDetailPage(key: args.key, partner: args.partner);
    },
  );
}

class DriftPartnerDetailRouteArgs {
  const DriftPartnerDetailRouteArgs({this.key, required this.partner});

  final Key? key;

  final PartnerUserDto partner;

  @override
  String toString() {
    return 'DriftPartnerDetailRouteArgs{key: $key, partner: $partner}';
  }
}

/// generated route for
/// [DriftPartnerPage]
class DriftPartnerRoute extends PageRouteInfo<void> {
  const DriftPartnerRoute({List<PageRouteInfo>? children})
    : super(DriftPartnerRoute.name, initialChildren: children);

  static const String name = 'DriftPartnerRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const DriftPartnerPage();
    },
  );
}

/// generated route for
/// [DriftPeopleCollectionPage]
class DriftPeopleCollectionRoute extends PageRouteInfo<void> {
  const DriftPeopleCollectionRoute({List<PageRouteInfo>? children})
    : super(DriftPeopleCollectionRoute.name, initialChildren: children);

  static const String name = 'DriftPeopleCollectionRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const DriftPeopleCollectionPage();
    },
  );
}

/// generated route for
/// [DriftPersonPage]
class DriftPersonRoute extends PageRouteInfo<DriftPersonRouteArgs> {
  DriftPersonRoute({
    Key? key,
    required DriftPerson person,
    List<PageRouteInfo>? children,
  }) : super(
         DriftPersonRoute.name,
         args: DriftPersonRouteArgs(key: key, person: person),
         initialChildren: children,
       );

  static const String name = 'DriftPersonRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<DriftPersonRouteArgs>();
      return DriftPersonPage(key: args.key, person: args.person);
    },
  );
}

class DriftPersonRouteArgs {
  const DriftPersonRouteArgs({this.key, required this.person});

  final Key? key;

  final DriftPerson person;

  @override
  String toString() {
    return 'DriftPersonRouteArgs{key: $key, person: $person}';
  }
}

/// generated route for
/// [DriftPlaceDetailPage]
class DriftPlaceDetailRoute extends PageRouteInfo<DriftPlaceDetailRouteArgs> {
  DriftPlaceDetailRoute({
    Key? key,
    required String place,
    List<PageRouteInfo>? children,
  }) : super(
         DriftPlaceDetailRoute.name,
         args: DriftPlaceDetailRouteArgs(key: key, place: place),
         initialChildren: children,
       );

  static const String name = 'DriftPlaceDetailRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<DriftPlaceDetailRouteArgs>();
      return DriftPlaceDetailPage(key: args.key, place: args.place);
    },
  );
}

class DriftPlaceDetailRouteArgs {
  const DriftPlaceDetailRouteArgs({this.key, required this.place});

  final Key? key;

  final String place;

  @override
  String toString() {
    return 'DriftPlaceDetailRouteArgs{key: $key, place: $place}';
  }
}

/// generated route for
/// [DriftPlacePage]
class DriftPlaceRoute extends PageRouteInfo<DriftPlaceRouteArgs> {
  DriftPlaceRoute({
    Key? key,
    LatLng? currentLocation,
    List<PageRouteInfo>? children,
  }) : super(
         DriftPlaceRoute.name,
         args: DriftPlaceRouteArgs(key: key, currentLocation: currentLocation),
         initialChildren: children,
       );

  static const String name = 'DriftPlaceRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<DriftPlaceRouteArgs>(
        orElse: () => const DriftPlaceRouteArgs(),
      );
      return DriftPlacePage(
        key: args.key,
        currentLocation: args.currentLocation,
      );
    },
  );
}

class DriftPlaceRouteArgs {
  const DriftPlaceRouteArgs({this.key, this.currentLocation});

  final Key? key;

  final LatLng? currentLocation;

  @override
  String toString() {
    return 'DriftPlaceRouteArgs{key: $key, currentLocation: $currentLocation}';
  }
}

/// generated route for
/// [DriftRecentlyTakenPage]
class DriftRecentlyTakenRoute extends PageRouteInfo<void> {
  const DriftRecentlyTakenRoute({List<PageRouteInfo>? children})
    : super(DriftRecentlyTakenRoute.name, initialChildren: children);

  static const String name = 'DriftRecentlyTakenRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const DriftRecentlyTakenPage();
    },
  );
}

/// generated route for
/// [DriftSearchPage]
class DriftSearchRoute extends PageRouteInfo<void> {
  const DriftSearchRoute({List<PageRouteInfo>? children})
    : super(DriftSearchRoute.name, initialChildren: children);

  static const String name = 'DriftSearchRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const DriftSearchPage();
    },
  );
}

/// generated route for
/// [DriftTrashPage]
class DriftTrashRoute extends PageRouteInfo<void> {
  const DriftTrashRoute({List<PageRouteInfo>? children})
    : super(DriftTrashRoute.name, initialChildren: children);

  static const String name = 'DriftTrashRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const DriftTrashPage();
    },
  );
}

/// generated route for
/// [DriftUploadDetailPage]
class DriftUploadDetailRoute extends PageRouteInfo<void> {
  const DriftUploadDetailRoute({List<PageRouteInfo>? children})
    : super(DriftUploadDetailRoute.name, initialChildren: children);

  static const String name = 'DriftUploadDetailRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const DriftUploadDetailPage();
    },
  );
}

/// generated route for
/// [DriftUserSelectionPage]
class DriftUserSelectionRoute
    extends PageRouteInfo<DriftUserSelectionRouteArgs> {
  DriftUserSelectionRoute({
    Key? key,
    required RemoteAlbum album,
    List<PageRouteInfo>? children,
  }) : super(
         DriftUserSelectionRoute.name,
         args: DriftUserSelectionRouteArgs(key: key, album: album),
         initialChildren: children,
       );

  static const String name = 'DriftUserSelectionRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<DriftUserSelectionRouteArgs>();
      return DriftUserSelectionPage(key: args.key, album: args.album);
    },
  );
}

class DriftUserSelectionRouteArgs {
  const DriftUserSelectionRouteArgs({this.key, required this.album});

  final Key? key;

  final RemoteAlbum album;

  @override
  String toString() {
    return 'DriftUserSelectionRouteArgs{key: $key, album: $album}';
  }
}

/// generated route for
/// [DriftVideoPage]
class DriftVideoRoute extends PageRouteInfo<void> {
  const DriftVideoRoute({List<PageRouteInfo>? children})
    : super(DriftVideoRoute.name, initialChildren: children);

  static const String name = 'DriftVideoRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const DriftVideoPage();
    },
  );
}

/// generated route for
/// [FolderPage]
class FolderRoute extends PageRouteInfo<FolderRouteArgs> {
  FolderRoute({
    Key? key,
    RecursiveFolder? folder,
    List<PageRouteInfo>? children,
  }) : super(
         FolderRoute.name,
         args: FolderRouteArgs(key: key, folder: folder),
         initialChildren: children,
       );

  static const String name = 'FolderRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<FolderRouteArgs>(
        orElse: () => const FolderRouteArgs(),
      );
      return FolderPage(key: args.key, folder: args.folder);
    },
  );
}

class FolderRouteArgs {
  const FolderRouteArgs({this.key, this.folder});

  final Key? key;

  final RecursiveFolder? folder;

  @override
  String toString() {
    return 'FolderRouteArgs{key: $key, folder: $folder}';
  }
}

/// generated route for
/// [HeaderSettingsPage]
class HeaderSettingsRoute extends PageRouteInfo<void> {
  const HeaderSettingsRoute({List<PageRouteInfo>? children})
    : super(HeaderSettingsRoute.name, initialChildren: children);

  static const String name = 'HeaderSettingsRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const HeaderSettingsPage();
    },
  );
}

/// generated route for
/// [LocalMediaSummaryPage]
class LocalMediaSummaryRoute extends PageRouteInfo<void> {
  const LocalMediaSummaryRoute({List<PageRouteInfo>? children})
    : super(LocalMediaSummaryRoute.name, initialChildren: children);

  static const String name = 'LocalMediaSummaryRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const LocalMediaSummaryPage();
    },
  );
}

/// generated route for
/// [LocalTimelinePage]
class LocalTimelineRoute extends PageRouteInfo<LocalTimelineRouteArgs> {
  LocalTimelineRoute({
    Key? key,
    required LocalAlbum album,
    List<PageRouteInfo>? children,
  }) : super(
         LocalTimelineRoute.name,
         args: LocalTimelineRouteArgs(key: key, album: album),
         initialChildren: children,
       );

  static const String name = 'LocalTimelineRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<LocalTimelineRouteArgs>();
      return LocalTimelinePage(key: args.key, album: args.album);
    },
  );
}

class LocalTimelineRouteArgs {
  const LocalTimelineRouteArgs({this.key, required this.album});

  final Key? key;

  final LocalAlbum album;

  @override
  String toString() {
    return 'LocalTimelineRouteArgs{key: $key, album: $album}';
  }
}

/// generated route for
/// [LoginPage]
class LoginRoute extends PageRouteInfo<void> {
  const LoginRoute({List<PageRouteInfo>? children})
    : super(LoginRoute.name, initialChildren: children);

  static const String name = 'LoginRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const LoginPage();
    },
  );
}

/// generated route for
/// [MainTimelinePage]
class MainTimelineRoute extends PageRouteInfo<void> {
  const MainTimelineRoute({List<PageRouteInfo>? children})
    : super(MainTimelineRoute.name, initialChildren: children);

  static const String name = 'MainTimelineRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const MainTimelinePage();
    },
  );
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

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<MapLocationPickerRouteArgs>(
        orElse: () => const MapLocationPickerRouteArgs(),
      );
      return MapLocationPickerPage(
        key: args.key,
        initialLatLng: args.initialLatLng,
      );
    },
  );
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
/// [PinAuthPage]
class PinAuthRoute extends PageRouteInfo<PinAuthRouteArgs> {
  PinAuthRoute({
    Key? key,
    bool createPinCode = false,
    List<PageRouteInfo>? children,
  }) : super(
         PinAuthRoute.name,
         args: PinAuthRouteArgs(key: key, createPinCode: createPinCode),
         initialChildren: children,
       );

  static const String name = 'PinAuthRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<PinAuthRouteArgs>(
        orElse: () => const PinAuthRouteArgs(),
      );
      return PinAuthPage(key: args.key, createPinCode: args.createPinCode);
    },
  );
}

class PinAuthRouteArgs {
  const PinAuthRouteArgs({this.key, this.createPinCode = false});

  final Key? key;

  final bool createPinCode;

  @override
  String toString() {
    return 'PinAuthRouteArgs{key: $key, createPinCode: $createPinCode}';
  }
}

/// generated route for
/// [ProfilePictureCropPage]
class ProfilePictureCropRoute
    extends PageRouteInfo<ProfilePictureCropRouteArgs> {
  ProfilePictureCropRoute({
    Key? key,
    required BaseAsset asset,
    List<PageRouteInfo>? children,
  }) : super(
         ProfilePictureCropRoute.name,
         args: ProfilePictureCropRouteArgs(key: key, asset: asset),
         initialChildren: children,
       );

  static const String name = 'ProfilePictureCropRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<ProfilePictureCropRouteArgs>();
      return ProfilePictureCropPage(key: args.key, asset: args.asset);
    },
  );
}

class ProfilePictureCropRouteArgs {
  const ProfilePictureCropRouteArgs({this.key, required this.asset});

  final Key? key;

  final BaseAsset asset;

  @override
  String toString() {
    return 'ProfilePictureCropRouteArgs{key: $key, asset: $asset}';
  }
}

/// generated route for
/// [RemoteAlbumPage]
class RemoteAlbumRoute extends PageRouteInfo<RemoteAlbumRouteArgs> {
  RemoteAlbumRoute({
    Key? key,
    required RemoteAlbum album,
    List<PageRouteInfo>? children,
  }) : super(
         RemoteAlbumRoute.name,
         args: RemoteAlbumRouteArgs(key: key, album: album),
         initialChildren: children,
       );

  static const String name = 'RemoteAlbumRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<RemoteAlbumRouteArgs>();
      return RemoteAlbumPage(key: args.key, album: args.album);
    },
  );
}

class RemoteAlbumRouteArgs {
  const RemoteAlbumRouteArgs({this.key, required this.album});

  final Key? key;

  final RemoteAlbum album;

  @override
  String toString() {
    return 'RemoteAlbumRouteArgs{key: $key, album: $album}';
  }
}

/// generated route for
/// [RemoteMediaSummaryPage]
class RemoteMediaSummaryRoute extends PageRouteInfo<void> {
  const RemoteMediaSummaryRoute({List<PageRouteInfo>? children})
    : super(RemoteMediaSummaryRoute.name, initialChildren: children);

  static const String name = 'RemoteMediaSummaryRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const RemoteMediaSummaryPage();
    },
  );
}

/// generated route for
/// [SettingsPage]
class SettingsRoute extends PageRouteInfo<void> {
  const SettingsRoute({List<PageRouteInfo>? children})
    : super(SettingsRoute.name, initialChildren: children);

  static const String name = 'SettingsRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const SettingsPage();
    },
  );
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
         args: SettingsSubRouteArgs(section: section, key: key),
         initialChildren: children,
       );

  static const String name = 'SettingsSubRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<SettingsSubRouteArgs>();
      return SettingsSubPage(args.section, key: args.key);
    },
  );
}

class SettingsSubRouteArgs {
  const SettingsSubRouteArgs({required this.section, this.key});

  final SettingSection section;

  final Key? key;

  @override
  String toString() {
    return 'SettingsSubRouteArgs{section: $section, key: $key}';
  }
}

/// generated route for
/// [ShareIntentPage]
class ShareIntentRoute extends PageRouteInfo<ShareIntentRouteArgs> {
  ShareIntentRoute({
    Key? key,
    required List<ShareIntentAttachment> attachments,
    List<PageRouteInfo>? children,
  }) : super(
         ShareIntentRoute.name,
         args: ShareIntentRouteArgs(key: key, attachments: attachments),
         initialChildren: children,
       );

  static const String name = 'ShareIntentRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<ShareIntentRouteArgs>();
      return ShareIntentPage(key: args.key, attachments: args.attachments);
    },
  );
}

class ShareIntentRouteArgs {
  const ShareIntentRouteArgs({this.key, required this.attachments});

  final Key? key;

  final List<ShareIntentAttachment> attachments;

  @override
  String toString() {
    return 'ShareIntentRouteArgs{key: $key, attachments: $attachments}';
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

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<SharedLinkEditRouteArgs>(
        orElse: () => const SharedLinkEditRouteArgs(),
      );
      return SharedLinkEditPage(
        key: args.key,
        existingLink: args.existingLink,
        assetsList: args.assetsList,
        albumId: args.albumId,
      );
    },
  );
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
    : super(SharedLinkRoute.name, initialChildren: children);

  static const String name = 'SharedLinkRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const SharedLinkPage();
    },
  );
}

/// generated route for
/// [SplashScreenPage]
class SplashScreenRoute extends PageRouteInfo<void> {
  const SplashScreenRoute({List<PageRouteInfo>? children})
    : super(SplashScreenRoute.name, initialChildren: children);

  static const String name = 'SplashScreenRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const SplashScreenPage();
    },
  );
}

/// generated route for
/// [SyncStatusPage]
class SyncStatusRoute extends PageRouteInfo<void> {
  const SyncStatusRoute({List<PageRouteInfo>? children})
    : super(SyncStatusRoute.name, initialChildren: children);

  static const String name = 'SyncStatusRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const SyncStatusPage();
    },
  );
}

/// generated route for
/// [TabShellPage]
class TabShellRoute extends PageRouteInfo<void> {
  const TabShellRoute({List<PageRouteInfo>? children})
    : super(TabShellRoute.name, initialChildren: children);

  static const String name = 'TabShellRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const TabShellPage();
    },
  );
}
