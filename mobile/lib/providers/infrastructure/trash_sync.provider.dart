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
  final enabledAV = ref.watch(appSettingStreamProvider(AppSettingsEnum.reviewOutOfSyncChangesAndroid));
  final service = ref.watch(trashSyncServiceProvider);
  return enabledAV.when(
    data: (enabled) => (enabled as bool? ?? false) ? service.watchPendingDecisionCount() : Stream<int>.value(0),
    loading: () => Stream<int>.value(0),
    error: (_, __) => Stream<int>.value(0),
  );
});
