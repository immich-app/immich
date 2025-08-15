import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/trash_sync.service.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/providers/infrastructure/storage.provider.dart';
import 'package:immich_mobile/repositories/local_files_manager.repository.dart';

import 'asset.provider.dart';

final trashSyncServiceProvider = Provider(
  (ref) => TrashSyncService(
    appSettingsService: ref.watch(appSettingsServiceProvider),
    remoteAssetRepository: ref.watch(remoteAssetRepositoryProvider),
    localAssetRepository: ref.watch(localAssetRepository),
    localFilesManager: ref.watch(localFilesManagerRepositoryProvider),
    storageRepository: ref.watch(storageRepositoryProvider),
  ),
);
