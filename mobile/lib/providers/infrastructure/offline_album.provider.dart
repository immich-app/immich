import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/offline_album.service.dart';
import 'package:immich_mobile/infrastructure/repositories/offline_album.repository.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';

final offlineAlbumRepositoryProvider = Provider<DriftOfflineAlbumRepository>(
  (ref) => DriftOfflineAlbumRepository(ref.watch(driftProvider)),
);

final offlineAlbumServiceProvider = Provider<OfflineAlbumService>(
  (ref) => OfflineAlbumService(ref.watch(offlineAlbumRepositoryProvider)),
);

final isAlbumOfflineProvider = StreamProvider.family<bool, String>(
  (ref, albumId) => ref.watch(offlineAlbumRepositoryProvider).watchIsAlbumOffline(albumId),
);

final offlineAlbumProgressProvider = StreamProvider.family<OfflineAlbumProgress, String>(
  (ref, albumId) => ref.watch(offlineAlbumRepositoryProvider).watchAlbumProgress(albumId),
);
