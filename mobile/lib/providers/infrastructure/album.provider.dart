import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/services/local_album.service.dart';
import 'package:immich_mobile/domain/services/remote_album.service.dart';
import 'package:immich_mobile/infrastructure/repositories/local_album.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/remote_album.repository.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/providers/infrastructure/remote_album.provider.dart';
import 'package:immich_mobile/repositories/drift_album_api_repository.dart';

final localAlbumRepository = Provider<DriftLocalAlbumRepository>(
  (ref) => DriftLocalAlbumRepository(ref.watch(driftProvider)),
);

final localAlbumServiceProvider = Provider<LocalAlbumService>(
  (ref) => LocalAlbumService(ref.watch(localAlbumRepository)),
);

final localAlbumProvider = FutureProvider<List<LocalAlbum>>(
  (ref) => LocalAlbumService(ref.watch(localAlbumRepository)).getAll(),
);

final localAlbumThumbnailProvider = FutureProvider.family<LocalAsset?, String>(
  (ref, albumId) =>
      LocalAlbumService(ref.watch(localAlbumRepository)).getThumbnail(albumId),
);

final remoteAlbumRepository = Provider<DriftRemoteAlbumRepository>(
  (ref) => DriftRemoteAlbumRepository(ref.watch(driftProvider)),
);

final remoteAlbumServiceProvider = Provider<RemoteAlbumService>(
  (ref) => RemoteAlbumService(
    ref.watch(remoteAlbumRepository),
    ref.watch(driftAlbumApiRepositoryProvider),
  ),
  dependencies: [remoteAlbumRepository],
);

final remoteAlbumProvider =
    NotifierProvider<RemoteAlbumNotifier, RemoteAlbumState>(
  RemoteAlbumNotifier.new,
  dependencies: [remoteAlbumServiceProvider],
);
