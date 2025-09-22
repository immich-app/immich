import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/hash.service.dart';
import 'package:immich_mobile/domain/services/local_sync.service.dart';
import 'package:immich_mobile/domain/services/sync_stream.service.dart';
import 'package:immich_mobile/infrastructure/repositories/sync_api.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/sync_stream.repository.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/cancel.provider.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';

final syncStreamServiceProvider = Provider(
  (ref) => SyncStreamService(
    syncApiRepository: ref.watch(syncApiRepositoryProvider),
    syncStreamRepository: ref.watch(syncStreamRepositoryProvider),
    cancelChecker: ref.watch(cancellationProvider),
  ),
);

final syncApiRepositoryProvider = Provider((ref) => SyncApiRepository(ref.watch(apiServiceProvider)));

final syncStreamRepositoryProvider = Provider((ref) => SyncStreamRepository(ref.watch(driftProvider)));

final localSyncServiceProvider = Provider(
  (ref) => LocalSyncService(
    localAlbumRepository: ref.watch(localAlbumRepository),
    nativeSyncApi: ref.watch(nativeSyncApiProvider),
  ),
);

final hashServiceProvider = Provider(
  (ref) => HashService(
    localAlbumRepository: ref.watch(localAlbumRepository),
    localAssetRepository: ref.watch(localAssetRepository),
    nativeSyncApi: ref.watch(nativeSyncApiProvider),
  ),
);
