import 'package:async/async.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/trash_sync.service.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/storage.provider.dart';
import 'package:immich_mobile/repositories/local_files_manager.repository.dart';

typedef TrashedAssetsCount = ({int total, int hashed});

final trashSyncServiceProvider = Provider(
  (ref) => TrashSyncService(
    appSettingsService: ref.watch(appSettingsServiceProvider),
    localAssetRepository: ref.watch(localAssetRepository),
    trashedLocalAssetRepository: ref.watch(trashedLocalAssetRepository),
    localFilesManager: ref.watch(localFilesManagerRepositoryProvider),
    storageRepository: ref.watch(storageRepositoryProvider),
  ),
);

final trashedAssetsCountProvider = StreamProvider<TrashedAssetsCount>((ref) {
  final repo = ref.watch(trashedLocalAssetRepository);
  final total$ = repo.watchCount();
  final hashed$ = repo.watchHashedCount();
  return StreamZip<int>([total$, hashed$]).map((values) => (total: values[0], hashed: values[1]));
});
