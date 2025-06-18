import 'package:auto_route/auto_route.dart';
import 'package:immich_mobile/providers/album/current_album.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/current_asset.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/services/album.service.dart';
import 'package:immich_mobile/services/asset.service.dart';
import 'package:immich_mobile/services/memory.service.dart';
import 'package:immich_mobile/widgets/asset_grid/asset_grid_data_structure.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

final deepLinkServiceProvider = Provider(
  (ref) => DeepLinkService(
    ref.watch(memoryServiceProvider),
    ref.watch(assetServiceProvider),
    ref.watch(albumServiceProvider),
    ref.watch(currentAssetProvider.notifier),
    ref.watch(currentAlbumProvider.notifier),
  ),
);

class DeepLinkService {
  final MemoryService _memoryService;
  final AssetService _assetService;
  final AlbumService _albumService;
  final CurrentAsset _currentAsset;
  final CurrentAlbum _currentAlbum;

  DeepLinkService(
    this._memoryService,
    this._assetService,
    this._albumService,
    this._currentAsset,
    this._currentAlbum,
  );

  Future<DeepLink> handle(PlatformDeepLink link, bool isColdStart) async {
    // get everything after the scheme, since Uri cannot parse path
    final intent = link.uri.host;
    final queryParams = link.uri.queryParameters;

    PageRouteInfo<dynamic>? deepLinkRoute;

    switch (intent) {
      case "memory":
        deepLinkRoute = await _buildMemoryDeepLink(queryParams['id'] ?? '');
      case "asset":
        deepLinkRoute = await _buildAssetDeepLink(queryParams['id'] ?? '');
      case "album":
        deepLinkRoute = await _buildAlbumDeepLink(queryParams['id'] ?? '');
    }

    // Deep link resolution failed, safely handle it based on the app state
    if (deepLinkRoute == null) {
      if (isColdStart) return DeepLink.defaultPath;
      return DeepLink.none;
    }

    return DeepLink([
      // we need something to segue back to if the app was cold started
      if (isColdStart) const PhotosRoute(),
      deepLinkRoute,
    ]);
  }

  Future<MemoryRoute?> _buildMemoryDeepLink(String memoryId) async {
    final memory = await _memoryService.getMemoryById(memoryId);

    if (memory == null) {
      return null;
    }

    return MemoryRoute(memories: [memory], memoryIndex: 0);
  }

  Future<GalleryViewerRoute?> _buildAssetDeepLink(String assetId) async {
    final asset = await _assetService.getAssetByRemoteId(assetId);

    if (asset == null) {
      return null;
    }

    _currentAsset.set(asset);
    final renderList = await RenderList.fromAssets([asset], GroupAssetsBy.auto);

    return GalleryViewerRoute(
      renderList: renderList,
      initialIndex: 0,
      heroOffset: 0,
      showStack: true,
    );
  }

  Future<AlbumViewerRoute?> _buildAlbumDeepLink(String albumId) async {
    final album = await _albumService.getAlbumByRemoteId(albumId);

    if (album == null) {
      return null;
    }

    _currentAlbum.set(album);

    return AlbumViewerRoute(albumId: album.id);
  }
}
