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
      : super(
          ActivitiesRoute.name,
          initialChildren: children,
        );

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
    required QueryBuilder<Asset, Asset, QAfterSortBy>? query,
    List<PageRouteInfo>? children,
  }) : super(
          AlbumAssetSelectionRoute.name,
          args: AlbumAssetSelectionRouteArgs(
            key: key,
            existingAssets: existingAssets,
            canDeselect: canDeselect,
            query: query,
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
        query: args.query,
      );
    },
  );
}

class AlbumAssetSelectionRouteArgs {
  const AlbumAssetSelectionRouteArgs({
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
    return 'AlbumAssetSelectionRouteArgs{key: $key, existingAssets: $existingAssets, canDeselect: $canDeselect, query: $query}';
  }
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

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<AlbumOptionsRouteArgs>();
      return AlbumOptionsPage(
        key: args.key,
        album: args.album,
      );
    },
  );
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
    required Album album,
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

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<AlbumPreviewRouteArgs>();
      return AlbumPreviewPage(
        key: args.key,
        album: args.album,
      );
    },
  );
}

class AlbumPreviewRouteArgs {
  const AlbumPreviewRouteArgs({
    this.key,
    required this.album,
  });

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
          args: AlbumSharedUserSelectionRouteArgs(
            key: key,
            assets: assets,
          ),
          initialChildren: children,
        );

  static const String name = 'AlbumSharedUserSelectionRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<AlbumSharedUserSelectionRouteArgs>();
      return AlbumSharedUserSelectionPage(
        key: args.key,
        assets: args.assets,
      );
    },
  );
}

class AlbumSharedUserSelectionRouteArgs {
  const AlbumSharedUserSelectionRouteArgs({
    this.key,
    required this.assets,
  });

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
          args: AlbumViewerRouteArgs(
            key: key,
            albumId: albumId,
          ),
          initialChildren: children,
        );

  static const String name = 'AlbumViewerRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<AlbumViewerRouteArgs>();
      return AlbumViewerPage(
        key: args.key,
        albumId: args.albumId,
      );
    },
  );
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
/// [AlbumsPage]
class AlbumsRoute extends PageRouteInfo<void> {
  const AlbumsRoute({List<PageRouteInfo>? children})
      : super(
          AlbumsRoute.name,
          initialChildren: children,
        );

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
      : super(
          AllMotionPhotosRoute.name,
          initialChildren: children,
        );

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
      : super(
          AllPeopleRoute.name,
          initialChildren: children,
        );

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
      : super(
          AllPlacesRoute.name,
          initialChildren: children,
        );

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
      : super(
          AllVideosRoute.name,
          initialChildren: children,
        );

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

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<AppLogDetailRouteArgs>();
      return AppLogDetailPage(
        key: args.key,
        logMessage: args.logMessage,
      );
    },
  );
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
      : super(
          ArchiveRoute.name,
          initialChildren: children,
        );

  static const String name = 'ArchiveRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const ArchivePage();
    },
  );
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
      : super(
          BackupControllerRoute.name,
          initialChildren: children,
        );

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
      : super(
          BackupOptionsRoute.name,
          initialChildren: children,
        );

  static const String name = 'BackupOptionsRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const BackupOptionsPage();
    },
  );
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
          args: CreateAlbumRouteArgs(
            key: key,
            assets: assets,
          ),
          initialChildren: children,
        );

  static const String name = 'CreateAlbumRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<CreateAlbumRouteArgs>(
          orElse: () => const CreateAlbumRouteArgs());
      return CreateAlbumPage(
        key: args.key,
        assets: args.assets,
      );
    },
  );
}

class CreateAlbumRouteArgs {
  const CreateAlbumRouteArgs({
    this.key,
    this.assets,
  });

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
          args: CropImageRouteArgs(
            key: key,
            image: image,
            asset: asset,
          ),
          initialChildren: children,
        );

  static const String name = 'CropImageRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<CropImageRouteArgs>();
      return CropImagePage(
        key: args.key,
        image: args.image,
        asset: args.asset,
      );
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
      : super(
          FailedBackupStatusRoute.name,
          initialChildren: children,
        );

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
      : super(
          FavoritesRoute.name,
          initialChildren: children,
        );

  static const String name = 'FavoritesRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const FavoritesPage();
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
          args: FilterImageRouteArgs(
            key: key,
            image: image,
            asset: asset,
          ),
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
      : super(
          HeaderSettingsRoute.name,
          initialChildren: children,
        );

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
      : super(
          LibraryRoute.name,
          initialChildren: children,
        );

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
      : super(
          LocalAlbumsRoute.name,
          initialChildren: children,
        );

  static const String name = 'LocalAlbumsRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const LocalAlbumsPage();
    },
  );
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

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const LoginPage();
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
          orElse: () => const MapLocationPickerRouteArgs());
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
class MapRoute extends PageRouteInfo<void> {
  const MapRoute({List<PageRouteInfo>? children})
      : super(
          MapRoute.name,
          initialChildren: children,
        );

  static const String name = 'MapRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const MapPage();
    },
  );
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

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<PartnerDetailRouteArgs>();
      return PartnerDetailPage(
        key: args.key,
        partner: args.partner,
      );
    },
  );
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
      : super(
          PeopleCollectionRoute.name,
          initialChildren: children,
        );

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
      : super(
          PermissionOnboardingRoute.name,
          initialChildren: children,
        );

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
      : super(
          PhotosRoute.name,
          initialChildren: children,
        );

  static const String name = 'PhotosRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const PhotosPage();
    },
  );
}

/// generated route for
/// [PlacesCollectionPage]
class PlacesCollectionRoute extends PageRouteInfo<void> {
  const PlacesCollectionRoute({List<PageRouteInfo>? children})
      : super(
          PlacesCollectionRoute.name,
          initialChildren: children,
        );

  static const String name = 'PlacesCollectionRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const PlacesCollectionPage();
    },
  );
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

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const RecentlyAddedPage();
    },
  );
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

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<SearchInputRouteArgs>(
          orElse: () => const SearchInputRouteArgs());
      return SearchInputPage(
        key: args.key,
        prefilter: args.prefilter,
      );
    },
  );
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

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const SearchPage();
    },
  );
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
          args: SettingsSubRouteArgs(
            section: section,
            key: key,
          ),
          initialChildren: children,
        );

  static const String name = 'SettingsSubRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<SettingsSubRouteArgs>();
      return SettingsSubPage(
        args.section,
        key: args.key,
      );
    },
  );
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

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<SharedLinkEditRouteArgs>(
          orElse: () => const SharedLinkEditRouteArgs());
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
      : super(
          SharedLinkRoute.name,
          initialChildren: children,
        );

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
      : super(
          SplashScreenRoute.name,
          initialChildren: children,
        );

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
      : super(
          TabControllerRoute.name,
          initialChildren: children,
        );

  static const String name = 'TabControllerRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const TabControllerPage();
    },
  );
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

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const TrashPage();
    },
  );
}
