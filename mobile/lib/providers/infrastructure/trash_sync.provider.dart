import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/trash_sync.service.dart';
import 'package:immich_mobile/infrastructure/repositories/trash_sync.repository.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/providers/infrastructure/storage.provider.dart';
import 'package:immich_mobile/repositories/local_files_manager.repository.dart';
import 'package:immich_mobile/services/app_settings.service.dart';

import 'asset.provider.dart';
import 'db.provider.dart';

final trashSyncRepositoryProvider = Provider<DriftTrashSyncRepository>(
  (ref) => DriftTrashSyncRepository(ref.watch(driftProvider)),
);

final trashSyncServiceProvider = Provider(
  (ref) => TrashSyncService(
    appSettingsService: ref.watch(appSettingsServiceProvider),
    remoteAssetRepository: ref.watch(remoteAssetRepositoryProvider),
    localAssetRepository: ref.watch(localAssetRepository),
    localFilesManager: ref.watch(localFilesManagerRepositoryProvider),
    storageRepository: ref.watch(storageRepositoryProvider),
    trashSyncRepository: ref.watch(trashSyncRepositoryProvider),
  ),
);

final outOfSyncCountProvider = StreamProvider<int>((ref) {
  final enabledReviewMode = ref.watch(appSettingStreamProvider(AppSettingsEnum.reviewOutOfSyncChangesAndroid));
  final service = ref.watch(trashSyncServiceProvider);
  return enabledReviewMode.when(
    data: (enabled) => (enabled as bool? ?? false) ? service.watchPendingApprovalCount() : Stream<int>.value(0),
    loading: () => Stream<int>.value(0),
    error: (_, __) => Stream<int>.value(0),
  );
});

// final isApprovalPendingProvider = StreamProvider.autoDispose.family<bool, String?>((ref, checksum) async* {
//   yield false;
//   if (checksum != null) {
//     yield* ref.watch(trashSyncServiceProvider).watchIsApprovalPending(checksum);
//   }
// });

final pendingApprovalChecksumsProvider = StreamProvider<Set<String>>((ref) {
  final enabledReviewMode = ref.watch(appSettingStreamProvider(AppSettingsEnum.reviewOutOfSyncChangesAndroid));
  final service = ref.watch(trashSyncServiceProvider);
  return enabledReviewMode.when(
    data: (enabled) => (enabled as bool? ?? false) ? service.watchPendingApprovalChecksums() : Stream.value(<String>{}),
    loading: () => Stream.value(<String>{}),
    error: (_, __) => Stream.value(<String>{}),
  );
});
