import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/infrastructure/repositories/local_album.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/remote_album.repository.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';

final localAlbumRepository = Provider<DriftLocalAlbumRepository>(
  (ref) => DriftLocalAlbumRepository(ref.watch(driftProvider)),
);

final remoteAlbumRepository = Provider<DriftRemoteAlbumRepository>(
  (ref) => DriftRemoteAlbumRepository(ref.watch(driftProvider)),
);
