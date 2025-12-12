import 'package:auto_route/auto_route.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/asset.service.dart' as beta_asset_service;
import 'package:immich_mobile/domain/services/memory.service.dart';
import 'package:immich_mobile/domain/services/remote_album.service.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_viewer.page.dart';
import 'package:immich_mobile/providers/album/current_album.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/current_asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart' as beta_asset_provider;
import 'package:immich_mobile/providers/infrastructure/memory.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/services/album.service.dart';
import 'package:immich_mobile/services/asset.service.dart';
import 'package:immich_mobile/services/memory.service.dart';
import 'package:immich_mobile/widgets/asset_grid/asset_grid_data_structure.dart';

final deepLinkServiceProvider = Provider(
  (ref) => DeepLinkService(
    ref.watch(memoryServiceProvider),
    ref.watch(assetServiceProvider),
    ref.watch(albumServiceProvider),
    ref.watch(currentAssetProvider.notifier),
    ref.watch(currentAlbumProvider.notifier),
    // Below is used for beta timeline
    ref.watch(timelineFactoryProvider),
    ref.watch(beta_asset_provider.assetServiceProvider),
    ref.watch(remoteAlbumServiceProvider),
    ref.watch(driftMemoryServiceProvider),
  ),
);

class DeepLinkService {
  /// TODO: Remove this when beta is default
  final MemoryService _memoryService;
  final AssetService _assetService;
  final AlbumService _albumService;
  final CurrentAsset _currentAsset;
  final CurrentAlbum _currentAlbum;

  /// Used for beta timeline
  final TimelineFactory _betaTimelineFactory;
  final beta_asset_service.AssetService _betaAssetService;
  final RemoteAlbumService _betaRemoteAlbumService;
  final DriftMemoryService _betaMemoryServiceProvider;

  const DeepLinkService(
    this._memoryService,
    this._assetService,
    this._albumService,
    this._currentAsset,
    this._currentAlbum,
    this._betaTimelineFactory,
    this._betaAssetService,
    this._betaRemoteAlbumService,
    this._betaMemoryServiceProvider,
  );

  DeepLink _handleColdStart(PageRouteInfo<dynamic> route, bool isColdStart) {
    return DeepLink([
      // we need something to segue back to if the app was cold started
      // TODO: use MainTimelineRoute this when beta is default
      if (isColdStart) (Store.isBetaTimelineEnabled) ? const TabShellRoute() : const PhotosRoute(),
      route,
    ]);
  }

  Future<DeepLink> handleScheme(PlatformDeepLink link, WidgetRef ref, bool isColdStart) async {
    // get everything after the scheme, since Uri cannot parse path
    final intent = link.uri.host;
    final queryParams = link.uri.queryParameters;

    PageRouteInfo<dynamic>? deepLinkRoute = switch (intent) {
      "memory" => await _buildMemoryDeepLink(queryParams['id'] ?? ''),
      "asset" => await _buildAssetDeepLink(queryParams['id'] ?? '', ref),
      "album" => await _buildAlbumDeepLink(queryParams['id'] ?? ''),
      "activity" => await _buildActivityDeepLink(queryParams['albumId'] ?? ''),
      _ => null,
    };

    // Deep link resolution failed, safely handle it based on the app state
    if (deepLinkRoute == null) {
      if (isColdStart) {
        return DeepLink.defaultPath;
      }

      return DeepLink.none;
    }

    return _handleColdStart(deepLinkRoute, isColdStart);
  }

  Future<DeepLink> handleMyImmichApp(PlatformDeepLink link, WidgetRef ref, bool isColdStart) async {
    final path = link.uri.path;

    const uuidRegex = r'[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}';
    final assetRegex = RegExp('/photos/($uuidRegex)');
    final albumRegex = RegExp('/albums/($uuidRegex)');

    PageRouteInfo<dynamic>? deepLinkRoute;
    if (assetRegex.hasMatch(path)) {
      final assetId = assetRegex.firstMatch(path)?.group(1) ?? '';
      deepLinkRoute = await _buildAssetDeepLink(assetId, ref);
    } else if (albumRegex.hasMatch(path)) {
      final albumId = albumRegex.firstMatch(path)?.group(1) ?? '';
      deepLinkRoute = await _buildAlbumDeepLink(albumId);
    }

    // Deep link resolution failed, safely handle it based on the app state
    if (deepLinkRoute == null) {
      if (isColdStart) return DeepLink.defaultPath;
      return DeepLink.none;
    }

    return _handleColdStart(deepLinkRoute, isColdStart);
  }

  Future<PageRouteInfo?> _buildMemoryDeepLink(String memoryId) async {
    if (Store.isBetaTimelineEnabled) {
      final memory = await _betaMemoryServiceProvider.get(memoryId);

      if (memory == null) {
        return null;
      }

      return DriftMemoryRoute(memories: [memory], memoryIndex: 0);
    } else {
      // TODO: Remove this when beta is default
      final memory = await _memoryService.getMemoryById(memoryId);

      if (memory == null) {
        return null;
      }

      return MemoryRoute(memories: [memory], memoryIndex: 0);
    }
  }

  Future<PageRouteInfo?> _buildAssetDeepLink(String assetId, WidgetRef ref) async {
    if (Store.isBetaTimelineEnabled) {
      final asset = await _betaAssetService.getRemoteAsset(assetId);
      if (asset == null) {
        return null;
      }

      AssetViewer.setAsset(ref, asset);
      return AssetViewerRoute(
        initialIndex: 0,
        timelineService: _betaTimelineFactory.fromAssets([asset], TimelineOrigin.deepLink),
      );
    } else {
      // TODO: Remove this when beta is default
      final asset = await _assetService.getAssetByRemoteId(assetId);
      if (asset == null) {
        return null;
      }

      _currentAsset.set(asset);
      final renderList = await RenderList.fromAssets([asset], GroupAssetsBy.auto);

      return GalleryViewerRoute(renderList: renderList, initialIndex: 0, heroOffset: 0, showStack: true);
    }
  }

  Future<PageRouteInfo?> _buildAlbumDeepLink(String albumId) async {
    if (Store.isBetaTimelineEnabled) {
      final album = await _betaRemoteAlbumService.get(albumId);

      if (album == null) {
        return null;
      }

      return RemoteAlbumRoute(album: album);
    } else {
      // TODO: Remove this when beta is default
      final album = await _albumService.getAlbumByRemoteId(albumId);

      if (album == null) {
        return null;
      }

      _currentAlbum.set(album);
      return AlbumViewerRoute(albumId: album.id);
    }
  }

  Future<PageRouteInfo?> _buildActivityDeepLink(String albumId) async {
    if (Store.isBetaTimelineEnabled == false) {
      return null;
    }

    final album = await _betaRemoteAlbumService.get(albumId);

    if (album == null || album.isActivityEnabled == false) {
      return null;
    }

    return DriftActivitiesRoute(album: album);
  }
}
