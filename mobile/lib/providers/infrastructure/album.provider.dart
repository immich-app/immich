import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/services/local_album.service.dart';
import 'package:immich_mobile/domain/services/remote_album.service.dart';
import 'package:immich_mobile/infrastructure/repositories/local_album.repository.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/providers/infrastructure/remote_album.provider.dart';
import 'package:immich_mobile/repositories/album_api_repository.dart';
import 'package:immich_mobile/services/foreground_upload.service.dart';

final localAlbumProvider = FutureProvider<List<LocalAlbum>>(
  (ref) => LocalAlbumService(ref.watch(driftProvider).localAlbumRepository)
      .getAll(sortBy: {SortLocalAlbumsBy.newestAsset})
      .then((albums) => albums.where((album) => album.assetCount > 0).toList()),
);

final localAlbumThumbnailProvider = FutureProvider.family<LocalAsset?, String>(
  (ref, albumId) => LocalAlbumService(ref.watch(driftProvider).localAlbumRepository).getThumbnail(albumId),
);

final remoteAlbumServiceProvider = Provider<RemoteAlbumService>(
  (ref) => RemoteAlbumService(
    ref.watch(driftProvider).remoteAlbumRepository,
    ref.watch(albumApiRepositoryProvider),
    ref.watch(foregroundUploadServiceProvider),
  ),
);

final remoteAlbumProvider = NotifierProvider<RemoteAlbumNotifier, RemoteAlbumState>(
  RemoteAlbumNotifier.new,
  dependencies: [remoteAlbumServiceProvider],
);

final albumsContainingAssetProvider = FutureProvider.family<List<RemoteAlbum>, String>(
  (ref, assetId) => ref.watch(remoteAlbumServiceProvider).getAlbumsContainingAsset(assetId),
);
