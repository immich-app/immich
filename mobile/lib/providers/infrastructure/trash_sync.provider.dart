import 'package:async/async.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/trash_sync.service.dart';
import 'package:immich_mobile/infrastructure/repositories/trash_sync.repository.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';

import 'db.provider.dart';

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
  (ref) => TrashSyncService(trashSyncRepository: ref.watch(trashSyncRepositoryProvider)),
);

final outOfSyncAssetsCountProvider = StreamProvider<int>((ref) {
  final enabledReviewMode = ref.watch(appSettingStreamProvider(AppSettingsEnum.reviewOutOfSyncChangesAndroid));
  final service = ref.watch(trashSyncServiceProvider);
  return enabledReviewMode.when(
    data: (enabled) => enabled ? service.watchPendingApprovalAssetCount() : Stream<int>.value(0),
    loading: () => Stream<int>.value(0),
    error: (_, __) => Stream<int>.value(0),
  );
});

final isWaitingForTrashApprovalProvider = StreamProvider.family<bool, String?>((ref, checksum) {
  final enabledReviewMode = ref.watch(appSettingStreamProvider(AppSettingsEnum.reviewOutOfSyncChangesAndroid));
  final service = ref.watch(trashSyncServiceProvider);
  return enabledReviewMode.when(
    data: (enabled) =>
        enabled && checksum != null ? service.watchIsAssetApprovalPending(checksum) : Stream.value(false),
    loading: () => Stream.value(false),
    error: (_, __) => Stream.value(false),
  );
});
