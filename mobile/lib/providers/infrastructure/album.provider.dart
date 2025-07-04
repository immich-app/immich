import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/remote_album.service.dart';
import 'package:immich_mobile/infrastructure/repositories/local_album.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/remote_album.repository.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/providers/infrastructure/remote_album.provider.dart';
import 'package:immich_mobile/repositories/album_api.repository.dart';

final localAlbumRepository = Provider<DriftLocalAlbumRepository>(
  (ref) => DriftLocalAlbumRepository(ref.watch(driftProvider)),
);

final remoteAlbumRepository = Provider<DriftRemoteAlbumRepository>(
  (ref) => DriftRemoteAlbumRepository(ref.watch(driftProvider)),
);

final remoteAlbumServiceProvider = Provider<RemoteAlbumService>(
  (ref) => RemoteAlbumService(
    ref.watch(remoteAlbumRepository),
    ref.watch(albumApiRepositoryProvider),
  ),
  dependencies: [remoteAlbumRepository],
);

final remoteAlbumProvider =
    NotifierProvider<RemoteAlbumNotifier, RemoteAlbumState>(
  RemoteAlbumNotifier.new,
  dependencies: [remoteAlbumServiceProvider],
);
