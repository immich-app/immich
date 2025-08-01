import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/asset.service.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/remote_asset.repository.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/providers/infrastructure/storage.provider.dart';
import 'package:immich_mobile/repositories/local_files_manager.repository.dart';
import 'package:logging/logging.dart';

final localAssetRepository = Provider<DriftLocalAssetRepository>(
  (ref) => DriftLocalAssetRepository(ref.watch(driftProvider)),
);

final remoteAssetRepositoryProvider = Provider<RemoteAssetRepository>(
  (ref) => RemoteAssetRepository(ref.watch(driftProvider)),
);

final assetServiceProvider = Provider(
  (ref) => AssetService(
    appSettingsService: ref.watch(appSettingsServiceProvider),
    remoteAssetRepository: ref.watch(remoteAssetRepositoryProvider),
    localAssetRepository: ref.watch(localAssetRepository),
    localFilesManager: ref.watch(localFilesManagerRepositoryProvider),
    storageRepository: ref.watch(storageRepositoryProvider),
    logger: Logger('AssetService'),
  ),
);

final placesProvider = FutureProvider<List<(String, String)>>(
  (ref) => AssetService(
    appSettingsService: ref.watch(appSettingsServiceProvider),
    remoteAssetRepository: ref.watch(remoteAssetRepositoryProvider),
    localAssetRepository: ref.watch(localAssetRepository),
    localFilesManager: ref.watch(localFilesManagerRepositoryProvider),
    storageRepository: ref.watch(storageRepositoryProvider),
    logger: Logger('AssetService'),
  ).getPlaces(),
);
