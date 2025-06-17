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

  Future<DeepLink> handle(PlatformDeepLink link) async {
    // get everything after the scheme, since Uri cannot parse path
    final request = link.uri.host;
    final queryParams = link.uri.queryParameters;

    switch (request) {
      case "memory":
        return _buildMemoryDeepLink(queryParams['id'] ?? '');
      case "asset":
        return _buildAssetDeepLink(queryParams['id'] ?? '');
      case "album":
        return _buildAlbumDeepLink(queryParams['id'] ?? '');
    }

    return DeepLink.none;
  }

  Future<DeepLink> _buildMemoryDeepLink(String memoryId) async {
    final memory = await _memoryService.getMemoryById(memoryId);

    if (memory == null) {
      return DeepLink.none;
    }

    return DeepLink([
      MemoryRoute(memories: [memory], memoryIndex: 0),
    ]);
  }

  Future<DeepLink> _buildAssetDeepLink(String assetId) async {
    final asset = await _assetService.getAssetByRemoteId(assetId);

    if (asset == null) {
      return DeepLink.none;
    }

    _currentAsset.set(asset);
    final renderList = await RenderList.fromAssets([asset], GroupAssetsBy.auto);

    return DeepLink([
      GalleryViewerRoute(
        renderList: renderList,
        initialIndex: 0,
        heroOffset: 0,
        showStack: true,
      ),
    ]);
  }

  Future<DeepLink> _buildAlbumDeepLink(String albumId) async {
    final album = await _albumService.getAlbumByRemoteId(albumId);

    if (album == null) {
      return DeepLink.none;
    }

    _currentAlbum.set(album);

    return DeepLink([
      AlbumViewerRoute(albumId: album.id),
    ]);
  }
}
