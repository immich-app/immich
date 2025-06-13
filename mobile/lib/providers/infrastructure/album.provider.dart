import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/interfaces/local_album.interface.dart';
import 'package:immich_mobile/domain/interfaces/remote_album.interface.dart';
import 'package:immich_mobile/domain/interfaces/album_api.interface.dart';
import 'package:immich_mobile/domain/services/album.service.dart';
import 'package:immich_mobile/infrastructure/repositories/local_album.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/remote_album.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/album_api.repository.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';

final localAlbumRepositoryProvider = Provider<ILocalAlbumRepository>(
  (ref) => DriftLocalAlbumRepository(ref.watch(driftProvider)),
);

final remoteAlbumRepositoryProvider = Provider<IRemoteAlbumRepository>(
  (ref) => DriftRemoteAlbumRepository(ref.watch(driftProvider)),
);

final albumApiRepositoryProvider = Provider<IAlbumApiRepository>(
  (ref) => AlbumApiRepository(ref.watch(apiServiceProvider)),
);

final albumServiceProvider = Provider.autoDispose<AlbumService>(
  (ref) =>
      throw UnimplementedError('Will be overridden through a ProviderScope.'),
);
