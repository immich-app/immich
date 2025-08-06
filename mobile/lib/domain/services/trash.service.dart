import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/remote_asset.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/storage.repository.dart';
import 'package:immich_mobile/repositories/local_files_manager.repository.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:logging/logging.dart';
import 'package:platform/platform.dart';

class TrashService {
  final AppSettingsService _appSettingsService;
  final RemoteAssetRepository _remoteAssetRepository;
  final DriftLocalAssetRepository _localAssetRepository;
  final LocalFilesManagerRepository _localFilesManager;
  final StorageRepository _storageRepository;
  final Platform _platform;
  final Logger _logger;

  const TrashService({
    required AppSettingsService appSettingsService,
    required RemoteAssetRepository remoteAssetRepository,
    required DriftLocalAssetRepository localAssetRepository,
    required LocalFilesManagerRepository localFilesManager,
    required StorageRepository storageRepository,
    required Logger logger,
  }) : _appSettingsService = appSettingsService,
       _remoteAssetRepository = remoteAssetRepository,
       _localAssetRepository = localAssetRepository,
       _localFilesManager = localFilesManager,
       _storageRepository = storageRepository,
       _platform = const LocalPlatform(),
       _logger = logger;

  Future<void> handleRemoteChanges(Iterable<({String checksum, DateTime? deletedAt})> syncItems) async {
    if (_platform.isAndroid && _appSettingsService.getSetting<bool>(AppSettingsEnum.manageLocalMediaAndroid)) {
      final trashedItems = syncItems.where((item) => item.deletedAt != null);

      if (trashedItems.isNotEmpty) {
        final trashedAssetsChecksums = trashedItems.map((syncItem) => syncItem.checksum);
        final localAssetsToTrash = await _localAssetRepository.getByChecksums(trashedAssetsChecksums);
        if (localAssetsToTrash.isNotEmpty) {
          final mediaUrls = await Future.wait(
            localAssetsToTrash.map(
              (localAsset) => _storageRepository.getAssetEntityForAsset(localAsset).then((e) => e?.getMediaUrl()),
            ),
          );
          _logger.info("Moving to trash ${mediaUrls.join(", ")} assets");
          await _localFilesManager.moveToTrash(mediaUrls.nonNulls.toList());
        }
      }
      final modifiedItems = syncItems.where((e) => e.deletedAt == null);
      if (modifiedItems.isNotEmpty) {
        final modifiedChecksums = modifiedItems.map((syncItem) => syncItem.checksum);
        final remoteAssetsToRestore = await _remoteAssetRepository.getByChecksums(modifiedChecksums, isTrashed: true);
        if (remoteAssetsToRestore.isNotEmpty) {
          _logger.info("Restoring from trash ${remoteAssetsToRestore.map((e) => e.name).join(", ")} assets");
          for (final remoteAsset in remoteAssetsToRestore) {
            await _localFilesManager.restoreFromTrash(remoteAsset.name, remoteAsset.type.index);
          }
        }
      }
    } else {
      return Future.value();
    }
  }
}
