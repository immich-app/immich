import 'package:async/async.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/trash_sync.model.dart';
import 'package:immich_mobile/domain/services/trash_sync.service.dart';
import 'package:immich_mobile/infrastructure/repositories/trash_sync.repository.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_mobile/repositories/asset_media.repository.dart';
import 'package:immich_mobile/repositories/permission.repository.dart';

typedef TrashedAssetsCount = ({int total, int hashed});

final trashSyncRepositoryProvider = Provider<DriftTrashSyncRepository>(
  (ref) => DriftTrashSyncRepository(ref.watch(driftProvider)),
);

final trashedAssetsCountProvider = StreamProvider<TrashedAssetsCount>((ref) {
  final repo = ref.watch(trashedLocalAssetRepository);
  final total$ = repo.watchCount();
  final hashed$ = repo.watchHashedCount();
  return StreamZip<int>([total$, hashed$]).map((values) => (total: values[0], hashed: values[1]));
});

final trashSyncServiceProvider = Provider(
  (ref) => TrashSyncService(
    trashedLocalAssetRepository: ref.watch(trashedLocalAssetRepository),
    trashSyncRepository: ref.watch(trashSyncRepositoryProvider),
    assetMediaRepository: ref.watch(assetMediaRepositoryProvider),
    permissionRepository: ref.watch(permissionRepositoryProvider),
    settingsRepository: ref.watch(settingsProvider),
  ),
);

final outOfSyncAssetsCountProvider = StreamProvider<int>((ref) {
  final enabledReviewMode = ref.watch(
    appConfigProvider.select((config) => config.trashSync.mode == TrashSyncMode.review),
  );
  final service = ref.watch(trashSyncServiceProvider);
  return enabledReviewMode ? service.watchPendingApprovalAssetCount() : Stream<int>.value(0);
});

final isWaitingForTrashApprovalProvider = StreamProvider.family<bool, String?>((ref, checksum) {
  final enabledReviewMode = ref.watch(
    appConfigProvider.select((config) => config.trashSync.mode == TrashSyncMode.review),
  );
  final service = ref.watch(trashSyncServiceProvider);
  return enabledReviewMode && checksum != null ? service.watchIsAssetApprovalPending(checksum) : Stream.value(false);
});
