// dart format width=80
// GENERATED CODE - DO NOT MODIFY BY HAND

// **************************************************************************
// AutoRouterGenerator
// **************************************************************************

// ignore_for_file: type=lint
// coverage:ignore-file

part of 'router.dart';

/// generated route for
/// [ActivitiesPage]
class ActivitiesRoute extends PageRouteInfo<void> {
  const ActivitiesRoute({List<PageRouteInfo>? children})
    : super(ActivitiesRoute.name, initialChildren: children);

  static const String name = 'ActivitiesRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const ActivitiesPage();
    },
  );
}

/// generated route for
/// [AlbumAdditionalSharedUserSelectionPage]
class AlbumAdditionalSharedUserSelectionRoute
    extends PageRouteInfo<AlbumAdditionalSharedUserSelectionRouteArgs> {
  AlbumAdditionalSharedUserSelectionRoute({
    Key? key,
    required Album album,
    List<PageRouteInfo>? children,
  }) : super(
         AlbumAdditionalSharedUserSelectionRoute.name,
         args: AlbumAdditionalSharedUserSelectionRouteArgs(
           key: key,
           album: album,
         ),
         initialChildren: children,
       );

  static const String name = 'AlbumAdditionalSharedUserSelectionRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<AlbumAdditionalSharedUserSelectionRouteArgs>();
      return AlbumAdditionalSharedUserSelectionPage(
        key: args.key,
        album: args.album,
      );
    },
  );
}

class AlbumAdditionalSharedUserSelectionRouteArgs {
  const AlbumAdditionalSharedUserSelectionRouteArgs({
    this.key,
    required this.album,
  });

  final Key? key;

  final Album album;

  @override
  String toString() {
    return 'AlbumAdditionalSharedUserSelectionRouteArgs{key: $key, album: $album}';
  }
}

/// generated route for
/// [AlbumAssetSelectionPage]
class AlbumAssetSelectionRoute
    extends PageRouteInfo<AlbumAssetSelectionRouteArgs> {
  AlbumAssetSelectionRoute({
    Key? key,
    required Set<Asset> existingAssets,
    bool canDeselect = false,
    List<PageRouteInfo>? children,
  }) : super(
         AlbumAssetSelectionRoute.name,
         args: AlbumAssetSelectionRouteArgs(
           key: key,
           existingAssets: existingAssets,
           canDeselect: canDeselect,
         ),
         initialChildren: children,
       );

  static const String name = 'AlbumAssetSelectionRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<AlbumAssetSelectionRouteArgs>();
      return AlbumAssetSelectionPage(
        key: args.key,
        existingAssets: args.existingAssets,
        canDeselect: args.canDeselect,
      );
    },
  );
}

class AlbumAssetSelectionRouteArgs {
  const AlbumAssetSelectionRouteArgs({
    this.key,
    required this.existingAssets,
    this.canDeselect = false,
  });

  final Key? key;

  final Set<Asset> existingAssets;

  final bool canDeselect;

  @override
  String toString() {
    return 'AlbumAssetSelectionRouteArgs{key: $key, existingAssets: $existingAssets, canDeselect: $canDeselect}';
  }
}

/// generated route for
/// [AlbumOptionsPage]
class AlbumOptionsRoute extends PageRouteInfo<void> {
  const AlbumOptionsRoute({List<PageRouteInfo>? children})
    : super(AlbumOptionsRoute.name, initialChildren: children);

  static const String name = 'AlbumOptionsRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const AlbumOptionsPage();
    },
  );
}

/// generated route for
/// [AlbumPreviewPage]
class AlbumPreviewRoute extends PageRouteInfo<AlbumPreviewRouteArgs> {
  AlbumPreviewRoute({
    Key? key,
    required Album album,
    List<PageRouteInfo>? children,
  }) : super(
         AlbumPreviewRoute.name,
         args: AlbumPreviewRouteArgs(key: key, album: album),
         initialChildren: children,
       );

  static const String name = 'AlbumPreviewRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<AlbumPreviewRouteArgs>();
      return AlbumPreviewPage(key: args.key, album: args.album);
    },
  );
}

class AlbumPreviewRouteArgs {
  const AlbumPreviewRouteArgs({this.key, required this.album});

  final Key? key;

  final Album album;

  @override
  String toString() {
    return 'AlbumPreviewRouteArgs{key: $key, album: $album}';
  }
}

/// generated route for
/// [AlbumSharedUserSelectionPage]
class AlbumSharedUserSelectionRoute
    extends PageRouteInfo<AlbumSharedUserSelectionRouteArgs> {
  AlbumSharedUserSelectionRoute({
    Key? key,
    required Set<Asset> assets,
    List<PageRouteInfo>? children,
  }) : super(
         AlbumSharedUserSelectionRoute.name,
         args: AlbumSharedUserSelectionRouteArgs(key: key, assets: assets),
         initialChildren: children,
       );

  static const String name = 'AlbumSharedUserSelectionRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<AlbumSharedUserSelectionRouteArgs>();
      return AlbumSharedUserSelectionPage(key: args.key, assets: args.assets);
    },
  );
}

class AlbumSharedUserSelectionRouteArgs {
  const AlbumSharedUserSelectionRouteArgs({this.key, required this.assets});

  final Key? key;

  final Set<Asset> assets;

  @override
  String toString() {
    return 'AlbumSharedUserSelectionRouteArgs{key: $key, assets: $assets}';
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
         args: AlbumViewerRouteArgs(key: key, albumId: albumId),
         initialChildren: children,
       );

  static const String name = 'AlbumViewerRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<AlbumViewerRouteArgs>();
      return AlbumViewerPage(key: args.key, albumId: args.albumId);
    },
  );
}

class AlbumViewerRouteArgs {
  const AlbumViewerRouteArgs({this.key, required this.albumId});

  final Key? key;

  final int albumId;

  @override
  String toString() {
    return 'AlbumViewerRouteArgs{key: $key, albumId: $albumId}';
  }
}

/// generated route for
/// [AlbumsPage]
class AlbumsRoute extends PageRouteInfo<void> {
  const AlbumsRoute({List<PageRouteInfo>? children})
    : super(AlbumsRoute.name, initialChildren: children);

  static const String name = 'AlbumsRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const AlbumsPage();
    },
  );
}

/// generated route for
/// [AllMotionPhotosPage]
class AllMotionPhotosRoute extends PageRouteInfo<void> {
  const AllMotionPhotosRoute({List<PageRouteInfo>? children})
    : super(AllMotionPhotosRoute.name, initialChildren: children);

  static const String name = 'AllMotionPhotosRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const AllMotionPhotosPage();
    },
  );
}

/// generated route for
/// [AllPeoplePage]
class AllPeopleRoute extends PageRouteInfo<void> {
  const AllPeopleRoute({List<PageRouteInfo>? children})
    : super(AllPeopleRoute.name, initialChildren: children);

  static const String name = 'AllPeopleRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const AllPeoplePage();
    },
  );
}

/// generated route for
/// [AllPlacesPage]
class AllPlacesRoute extends PageRouteInfo<void> {
  const AllPlacesRoute({List<PageRouteInfo>? children})
    : super(AllPlacesRoute.name, initialChildren: children);

  static const String name = 'AllPlacesRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const AllPlacesPage();
    },
  );
}

/// generated route for
/// [AllVideosPage]
class AllVideosRoute extends PageRouteInfo<void> {
  const AllVideosRoute({List<PageRouteInfo>? children})
    : super(AllVideosRoute.name, initialChildren: children);

  static const String name = 'AllVideosRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const AllVideosPage();
    },
  );
}

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
/// [ArchivePage]
class ArchiveRoute extends PageRouteInfo<void> {
  const ArchiveRoute({List<PageRouteInfo>? children})
    : super(ArchiveRoute.name, initialChildren: children);

  static const String name = 'ArchiveRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const ArchivePage();
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
    List<PageRouteInfo>? children,
  }) : super(
         AssetViewerRoute.name,
         args: AssetViewerRouteArgs(
           key: key,
           initialIndex: initialIndex,
           timelineService: timelineService,
           heroOffset: heroOffset,
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
  });

  final Key? key;

  final int initialIndex;

  final TimelineService timelineService;

  final int? heroOffset;

  @override
  String toString() {
    return 'AssetViewerRouteArgs{key: $key, initialIndex: $initialIndex, timelineService: $timelineService, heroOffset: $heroOffset}';
  }
}

/// generated route for
/// [BackupAlbumSelectionPage]
class BackupAlbumSelectionRoute extends PageRouteInfo<void> {
  const BackupAlbumSelectionRoute({List<PageRouteInfo>? children})
    : super(BackupAlbumSelectionRoute.name, initialChildren: children);

  static const String name = 'BackupAlbumSelectionRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const BackupAlbumSelectionPage();
    },
  );
}

/// generated route for
/// [BackupControllerPage]
class BackupControllerRoute extends PageRouteInfo<void> {
  const BackupControllerRoute({List<PageRouteInfo>? children})
    : super(BackupControllerRoute.name, initialChildren: children);

  static const String name = 'BackupControllerRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const BackupControllerPage();
    },
  );
}

/// generated route for
/// [BackupOptionsPage]
class BackupOptionsRoute extends PageRouteInfo<void> {
  const BackupOptionsRoute({List<PageRouteInfo>? children})
    : super(BackupOptionsRoute.name, initialChildren: children);

  static const String name = 'BackupOptionsRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const BackupOptionsPage();
    },
  );
}

/// generated route for
/// [BetaSyncSettingsPage]
class BetaSyncSettingsRoute extends PageRouteInfo<void> {
  const BetaSyncSettingsRoute({List<PageRouteInfo>? children})
    : super(BetaSyncSettingsRoute.name, initialChildren: children);

  static const String name = 'BetaSyncSettingsRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const BetaSyncSettingsPage();
    },
  );
}

/// generated route for
/// [ChangeExperiencePage]
class ChangeExperienceRoute extends PageRouteInfo<ChangeExperienceRouteArgs> {
  ChangeExperienceRoute({
    Key? key,
    required bool switchingToBeta,
    List<PageRouteInfo>? children,
  }) : super(
         ChangeExperienceRoute.name,
         args: ChangeExperienceRouteArgs(
           key: key,
           switchingToBeta: switchingToBeta,
         ),
         initialChildren: children,
       );

  static const String name = 'ChangeExperienceRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<ChangeExperienceRouteArgs>();
      return ChangeExperiencePage(
        key: args.key,
        switchingToBeta: args.switchingToBeta,
      );
    },
  );
}

class ChangeExperienceRouteArgs {
  const ChangeExperienceRouteArgs({this.key, required this.switchingToBeta});

  final Key? key;

  final bool switchingToBeta;

  @override
  String toString() {
    return 'ChangeExperienceRouteArgs{key: $key, switchingToBeta: $switchingToBeta}';
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
/// [CreateAlbumPage]
class CreateAlbumRoute extends PageRouteInfo<CreateAlbumRouteArgs> {
  CreateAlbumRoute({
    Key? key,
    List<Asset>? assets,
    List<PageRouteInfo>? children,
  }) : super(
         CreateAlbumRoute.name,
         args: CreateAlbumRouteArgs(key: key, assets: assets),
         initialChildren: children,
       );

  static const String name = 'CreateAlbumRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<CreateAlbumRouteArgs>(
        orElse: () => const CreateAlbumRouteArgs(),
      );
      return CreateAlbumPage(key: args.key, assets: args.assets);
    },
  );
}

class CreateAlbumRouteArgs {
  const CreateAlbumRouteArgs({this.key, this.assets});

  final Key? key;

  final List<Asset>? assets;

  @override
  String toString() {
    return 'CreateAlbumRouteArgs{key: $key, assets: $assets}';
  }
}

/// generated route for
/// [CropImagePage]
class CropImageRoute extends PageRouteInfo<CropImageRouteArgs> {
  CropImageRoute({
    Key? key,
    required Image image,
    required Asset asset,
    List<PageRouteInfo>? children,
  }) : super(
         CropImageRoute.name,
         args: CropImageRouteArgs(key: key, image: image, asset: asset),
         initialChildren: children,
       );

  static const String name = 'CropImageRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<CropImageRouteArgs>();
      return CropImagePage(key: args.key, image: args.image, asset: args.asset);
    },
  );
}

class CropImageRouteArgs {
  const CropImageRouteArgs({
    this.key,
    required this.image,
    required this.asset,
  });

  final Key? key;

  final Image image;

  final Asset asset;

  @override
  String toString() {
    return 'CropImageRouteArgs{key: $key, image: $image, asset: $asset}';
  }
}

/// generated route for
/// [DriftActivitiesPage]
class DriftActivitiesRoute extends PageRouteInfo<void> {
  const DriftActivitiesRoute({List<PageRouteInfo>? children})
    : super(DriftActivitiesRoute.name, initialChildren: children);

  static const String name = 'DriftActivitiesRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const DriftActivitiesPage();
    },
  );
}

/// generated route for
/// [DriftAlbumOptionsPage]
class DriftAlbumOptionsRoute extends PageRouteInfo<void> {
  const DriftAlbumOptionsRoute({List<PageRouteInfo>? children})
    : super(DriftAlbumOptionsRoute.name, initialChildren: children);

  static const String name = 'DriftAlbumOptionsRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const DriftAlbumOptionsPage();
    },
  );
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
/// [DriftCropImagePage]
class DriftCropImageRoute extends PageRouteInfo<DriftCropImageRouteArgs> {
  DriftCropImageRoute({
    Key? key,
    required Image image,
    required BaseAsset asset,
    List<PageRouteInfo>? children,
  }) : super(
         DriftCropImageRoute.name,
         args: DriftCropImageRouteArgs(key: key, image: image, asset: asset),
         initialChildren: children,
       );

  static const String name = 'DriftCropImageRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<DriftCropImageRouteArgs>();
      return DriftCropImagePage(
        key: args.key,
        image: args.image,
        asset: args.asset,
      );
    },
  );
}

class DriftCropImageRouteArgs {
  const DriftCropImageRouteArgs({
    this.key,
    required this.image,
    required this.asset,
  });

  final Key? key;

  final Image image;

  final BaseAsset asset;

  @override
  String toString() {
    return 'DriftCropImageRouteArgs{key: $key, image: $image, asset: $asset}';
  }
}

/// generated route for
/// [DriftEditImagePage]
class DriftEditImageRoute extends PageRouteInfo<DriftEditImageRouteArgs> {
  DriftEditImageRoute({
    Key? key,
    required BaseAsset asset,
    required Image image,
    required bool isEdited,
    List<PageRouteInfo>? children,
  }) : super(
         DriftEditImageRoute.name,
         args: DriftEditImageRouteArgs(
           key: key,
           asset: asset,
           image: image,
           isEdited: isEdited,
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
        asset: args.asset,
        image: args.image,
        isEdited: args.isEdited,
      );
    },
  );
}

class DriftEditImageRouteArgs {
  const DriftEditImageRouteArgs({
    this.key,
    required this.asset,
    required this.image,
    required this.isEdited,
  });

  final Key? key;

  final BaseAsset asset;

  final Image image;

  final bool isEdited;

  @override
  String toString() {
    return 'DriftEditImageRouteArgs{key: $key, asset: $asset, image: $image, isEdited: $isEdited}';
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
/// [DriftFilterImagePage]
class DriftFilterImageRoute extends PageRouteInfo<DriftFilterImageRouteArgs> {
  DriftFilterImageRoute({
    Key? key,
    required Image image,
    required BaseAsset asset,
    List<PageRouteInfo>? children,
  }) : super(
         DriftFilterImageRoute.name,
         args: DriftFilterImageRouteArgs(key: key, image: image, asset: asset),
         initialChildren: children,
       );

  static const String name = 'DriftFilterImageRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<DriftFilterImageRouteArgs>();
      return DriftFilterImagePage(
        key: args.key,
        image: args.image,
        asset: args.asset,
      );
    },
  );
}

class DriftFilterImageRouteArgs {
  const DriftFilterImageRouteArgs({
    this.key,
    required this.image,
    required this.asset,
  });

  final Key? key;

  final Image image;

  final BaseAsset asset;

  @override
  String toString() {
    return 'DriftFilterImageRouteArgs{key: $key, image: $image, asset: $asset}';
  }
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
class DriftSearchRoute extends PageRouteInfo<DriftSearchRouteArgs> {
  DriftSearchRoute({
    Key? key,
    SearchFilter? preFilter,
    List<PageRouteInfo>? children,
  }) : super(
         DriftSearchRoute.name,
         args: DriftSearchRouteArgs(key: key, preFilter: preFilter),
         initialChildren: children,
       );

  static const String name = 'DriftSearchRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<DriftSearchRouteArgs>(
        orElse: () => const DriftSearchRouteArgs(),
      );
      return DriftSearchPage(key: args.key, preFilter: args.preFilter);
    },
  );
}

class DriftSearchRouteArgs {
  const DriftSearchRouteArgs({this.key, this.preFilter});

  final Key? key;

  final SearchFilter? preFilter;

  @override
  String toString() {
    return 'DriftSearchRouteArgs{key: $key, preFilter: $preFilter}';
  }
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
/// [EditImagePage]
class EditImageRoute extends PageRouteInfo<EditImageRouteArgs> {
  EditImageRoute({
    Key? key,
    required Asset asset,
    required Image image,
    required bool isEdited,
    List<PageRouteInfo>? children,
  }) : super(
         EditImageRoute.name,
         args: EditImageRouteArgs(
           key: key,
           asset: asset,
           image: image,
           isEdited: isEdited,
         ),
         initialChildren: children,
       );

  static const String name = 'EditImageRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<EditImageRouteArgs>();
      return EditImagePage(
        key: args.key,
        asset: args.asset,
        image: args.image,
        isEdited: args.isEdited,
      );
    },
  );
}

class EditImageRouteArgs {
  const EditImageRouteArgs({
    this.key,
    required this.asset,
    required this.image,
    required this.isEdited,
  });

  final Key? key;

  final Asset asset;

  final Image image;

  final bool isEdited;

  @override
  String toString() {
    return 'EditImageRouteArgs{key: $key, asset: $asset, image: $image, isEdited: $isEdited}';
  }
}

/// generated route for
/// [FailedBackupStatusPage]
class FailedBackupStatusRoute extends PageRouteInfo<void> {
  const FailedBackupStatusRoute({List<PageRouteInfo>? children})
    : super(FailedBackupStatusRoute.name, initialChildren: children);

  static const String name = 'FailedBackupStatusRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const FailedBackupStatusPage();
    },
  );
}

/// generated route for
/// [FavoritesPage]
class FavoritesRoute extends PageRouteInfo<void> {
  const FavoritesRoute({List<PageRouteInfo>? children})
    : super(FavoritesRoute.name, initialChildren: children);

  static const String name = 'FavoritesRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const FavoritesPage();
    },
  );
}

/// generated route for
/// [FeatInDevPage]
class FeatInDevRoute extends PageRouteInfo<void> {
  const FeatInDevRoute({List<PageRouteInfo>? children})
    : super(FeatInDevRoute.name, initialChildren: children);

  static const String name = 'FeatInDevRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const FeatInDevPage();
    },
  );
}

/// generated route for
/// [FilterImagePage]
class FilterImageRoute extends PageRouteInfo<FilterImageRouteArgs> {
  FilterImageRoute({
    Key? key,
    required Image image,
    required Asset asset,
    List<PageRouteInfo>? children,
  }) : super(
         FilterImageRoute.name,
         args: FilterImageRouteArgs(key: key, image: image, asset: asset),
         initialChildren: children,
       );

  static const String name = 'FilterImageRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<FilterImageRouteArgs>();
      return FilterImagePage(
        key: args.key,
        image: args.image,
        asset: args.asset,
      );
    },
  );
}

class FilterImageRouteArgs {
  const FilterImageRouteArgs({
    this.key,
    required this.image,
    required this.asset,
  });

  final Key? key;

  final Image image;

  final Asset asset;

  @override
  String toString() {
    return 'FilterImageRouteArgs{key: $key, image: $image, asset: $asset}';
  }
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
/// [GalleryViewerPage]
class GalleryViewerRoute extends PageRouteInfo<GalleryViewerRouteArgs> {
  GalleryViewerRoute({
    Key? key,
    required RenderList renderList,
    int initialIndex = 0,
    int heroOffset = 0,
    bool showStack = false,
    List<PageRouteInfo>? children,
  }) : super(
         GalleryViewerRoute.name,
         args: GalleryViewerRouteArgs(
           key: key,
           renderList: renderList,
           initialIndex: initialIndex,
           heroOffset: heroOffset,
           showStack: showStack,
         ),
         initialChildren: children,
       );

  static const String name = 'GalleryViewerRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<GalleryViewerRouteArgs>();
      return GalleryViewerPage(
        key: args.key,
        renderList: args.renderList,
        initialIndex: args.initialIndex,
        heroOffset: args.heroOffset,
        showStack: args.showStack,
      );
    },
  );
}

class GalleryViewerRouteArgs {
  const GalleryViewerRouteArgs({
    this.key,
    required this.renderList,
    this.initialIndex = 0,
    this.heroOffset = 0,
    this.showStack = false,
  });

  final Key? key;

  final RenderList renderList;

  final int initialIndex;

  final int heroOffset;

  final bool showStack;

  @override
  String toString() {
    return 'GalleryViewerRouteArgs{key: $key, renderList: $renderList, initialIndex: $initialIndex, heroOffset: $heroOffset, showStack: $showStack}';
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
/// [LibraryPage]
class LibraryRoute extends PageRouteInfo<void> {
  const LibraryRoute({List<PageRouteInfo>? children})
    : super(LibraryRoute.name, initialChildren: children);

  static const String name = 'LibraryRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const LibraryPage();
    },
  );
}

/// generated route for
/// [LocalAlbumsPage]
class LocalAlbumsRoute extends PageRouteInfo<void> {
  const LocalAlbumsRoute({List<PageRouteInfo>? children})
    : super(LocalAlbumsRoute.name, initialChildren: children);

  static const String name = 'LocalAlbumsRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const LocalAlbumsPage();
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
/// [LockedPage]
class LockedRoute extends PageRouteInfo<void> {
  const LockedRoute({List<PageRouteInfo>? children})
    : super(LockedRoute.name, initialChildren: children);

  static const String name = 'LockedRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const LockedPage();
    },
  );
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
/// [MapPage]
class MapRoute extends PageRouteInfo<MapRouteArgs> {
  MapRoute({Key? key, LatLng? initialLocation, List<PageRouteInfo>? children})
    : super(
        MapRoute.name,
        args: MapRouteArgs(key: key, initialLocation: initialLocation),
        initialChildren: children,
      );

  static const String name = 'MapRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<MapRouteArgs>(
        orElse: () => const MapRouteArgs(),
      );
      return MapPage(key: args.key, initialLocation: args.initialLocation);
    },
  );
}

class MapRouteArgs {
  const MapRouteArgs({this.key, this.initialLocation});

  final Key? key;

  final LatLng? initialLocation;

  @override
  String toString() {
    return 'MapRouteArgs{key: $key, initialLocation: $initialLocation}';
  }
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

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<MemoryRouteArgs>();
      return MemoryPage(
        memories: args.memories,
        memoryIndex: args.memoryIndex,
        key: args.key,
      );
    },
  );
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
/// [NativeVideoViewerPage]
class NativeVideoViewerRoute extends PageRouteInfo<NativeVideoViewerRouteArgs> {
  NativeVideoViewerRoute({
    Key? key,
    required Asset asset,
    required Widget image,
    bool showControls = true,
    int playbackDelayFactor = 1,
    List<PageRouteInfo>? children,
  }) : super(
         NativeVideoViewerRoute.name,
         args: NativeVideoViewerRouteArgs(
           key: key,
           asset: asset,
           image: image,
           showControls: showControls,
           playbackDelayFactor: playbackDelayFactor,
         ),
         initialChildren: children,
       );

  static const String name = 'NativeVideoViewerRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<NativeVideoViewerRouteArgs>();
      return NativeVideoViewerPage(
        key: args.key,
        asset: args.asset,
        image: args.image,
        showControls: args.showControls,
        playbackDelayFactor: args.playbackDelayFactor,
      );
    },
  );
}

class NativeVideoViewerRouteArgs {
  const NativeVideoViewerRouteArgs({
    this.key,
    required this.asset,
    required this.image,
    this.showControls = true,
    this.playbackDelayFactor = 1,
  });

  final Key? key;

  final Asset asset;

  final Widget image;

  final bool showControls;

  final int playbackDelayFactor;

  @override
  String toString() {
    return 'NativeVideoViewerRouteArgs{key: $key, asset: $asset, image: $image, showControls: $showControls, playbackDelayFactor: $playbackDelayFactor}';
  }
}

/// generated route for
/// [PartnerDetailPage]
class PartnerDetailRoute extends PageRouteInfo<PartnerDetailRouteArgs> {
  PartnerDetailRoute({
    Key? key,
    required UserDto partner,
    List<PageRouteInfo>? children,
  }) : super(
         PartnerDetailRoute.name,
         args: PartnerDetailRouteArgs(key: key, partner: partner),
         initialChildren: children,
       );

  static const String name = 'PartnerDetailRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<PartnerDetailRouteArgs>();
      return PartnerDetailPage(key: args.key, partner: args.partner);
    },
  );
}

class PartnerDetailRouteArgs {
  const PartnerDetailRouteArgs({this.key, required this.partner});

  final Key? key;

  final UserDto partner;

  @override
  String toString() {
    return 'PartnerDetailRouteArgs{key: $key, partner: $partner}';
  }
}

/// generated route for
/// [PartnerPage]
class PartnerRoute extends PageRouteInfo<void> {
  const PartnerRoute({List<PageRouteInfo>? children})
    : super(PartnerRoute.name, initialChildren: children);

  static const String name = 'PartnerRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const PartnerPage();
    },
  );
}

/// generated route for
/// [PeopleCollectionPage]
class PeopleCollectionRoute extends PageRouteInfo<void> {
  const PeopleCollectionRoute({List<PageRouteInfo>? children})
    : super(PeopleCollectionRoute.name, initialChildren: children);

  static const String name = 'PeopleCollectionRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const PeopleCollectionPage();
    },
  );
}

/// generated route for
/// [PermissionOnboardingPage]
class PermissionOnboardingRoute extends PageRouteInfo<void> {
  const PermissionOnboardingRoute({List<PageRouteInfo>? children})
    : super(PermissionOnboardingRoute.name, initialChildren: children);

  static const String name = 'PermissionOnboardingRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const PermissionOnboardingPage();
    },
  );
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

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<PersonResultRouteArgs>();
      return PersonResultPage(
        key: args.key,
        personId: args.personId,
        personName: args.personName,
      );
    },
  );
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
/// [PhotosPage]
class PhotosRoute extends PageRouteInfo<void> {
  const PhotosRoute({List<PageRouteInfo>? children})
    : super(PhotosRoute.name, initialChildren: children);

  static const String name = 'PhotosRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const PhotosPage();
    },
  );
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
/// [PlacesCollectionPage]
class PlacesCollectionRoute extends PageRouteInfo<PlacesCollectionRouteArgs> {
  PlacesCollectionRoute({
    Key? key,
    LatLng? currentLocation,
    List<PageRouteInfo>? children,
  }) : super(
         PlacesCollectionRoute.name,
         args: PlacesCollectionRouteArgs(
           key: key,
           currentLocation: currentLocation,
         ),
         initialChildren: children,
       );

  static const String name = 'PlacesCollectionRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<PlacesCollectionRouteArgs>(
        orElse: () => const PlacesCollectionRouteArgs(),
      );
      return PlacesCollectionPage(
        key: args.key,
        currentLocation: args.currentLocation,
      );
    },
  );
}

class PlacesCollectionRouteArgs {
  const PlacesCollectionRouteArgs({this.key, this.currentLocation});

  final Key? key;

  final LatLng? currentLocation;

  @override
  String toString() {
    return 'PlacesCollectionRouteArgs{key: $key, currentLocation: $currentLocation}';
  }
}

/// generated route for
/// [RecentlyTakenPage]
class RecentlyTakenRoute extends PageRouteInfo<void> {
  const RecentlyTakenRoute({List<PageRouteInfo>? children})
    : super(RecentlyTakenRoute.name, initialChildren: children);

  static const String name = 'RecentlyTakenRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const RecentlyTakenPage();
    },
  );
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
/// [SearchPage]
class SearchRoute extends PageRouteInfo<SearchRouteArgs> {
  SearchRoute({
    Key? key,
    SearchFilter? prefilter,
    List<PageRouteInfo>? children,
  }) : super(
         SearchRoute.name,
         args: SearchRouteArgs(key: key, prefilter: prefilter),
         initialChildren: children,
       );

  static const String name = 'SearchRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<SearchRouteArgs>(
        orElse: () => const SearchRouteArgs(),
      );
      return SearchPage(key: args.key, prefilter: args.prefilter);
    },
  );
}

class SearchRouteArgs {
  const SearchRouteArgs({this.key, this.prefilter});

  final Key? key;

  final SearchFilter? prefilter;

  @override
  String toString() {
    return 'SearchRouteArgs{key: $key, prefilter: $prefilter}';
  }
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
/// [TabControllerPage]
class TabControllerRoute extends PageRouteInfo<void> {
  const TabControllerRoute({List<PageRouteInfo>? children})
    : super(TabControllerRoute.name, initialChildren: children);

  static const String name = 'TabControllerRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const TabControllerPage();
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

/// generated route for
/// [TrashPage]
class TrashRoute extends PageRouteInfo<void> {
  const TrashRoute({List<PageRouteInfo>? children})
    : super(TrashRoute.name, initialChildren: children);

  static const String name = 'TrashRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const TrashPage();
    },
  );
}
