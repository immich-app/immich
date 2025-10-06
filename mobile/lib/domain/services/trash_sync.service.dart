import 'package:immich_mobile/extensions/platform_extensions.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/storage.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/trashed_local_asset.repository.dart';
import 'package:immich_mobile/repositories/local_files_manager.repository.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:logging/logging.dart';

class TrashSyncService {
  final AppSettingsService _appSettingsService;
  final DriftLocalAssetRepository _localAssetRepository;
  final DriftTrashedLocalAssetRepository _trashedLocalAssetRepository;
  final LocalFilesManagerRepository _localFilesManager;
  final StorageRepository _storageRepository;
  final Logger _logger = Logger('TrashService');

  TrashSyncService({
    required AppSettingsService appSettingsService,
    required DriftLocalAssetRepository localAssetRepository,
    required DriftTrashedLocalAssetRepository trashedLocalAssetRepository,
    required LocalFilesManagerRepository localFilesManager,
    required StorageRepository storageRepository,
  }) : _appSettingsService = appSettingsService,
       _localAssetRepository = localAssetRepository,
       _trashedLocalAssetRepository = trashedLocalAssetRepository,
       _localFilesManager = localFilesManager,
       _storageRepository = storageRepository;

  bool get isTrashSyncMode =>
      CurrentPlatform.isAndroid && _appSettingsService.getSetting<bool>(AppSettingsEnum.manageLocalMediaAndroid);


  Future<void> handleRemoteTrashed(Iterable<String> checksums) async {
    if (checksums.isEmpty) {
      return Future.value();
    } else {
      final localAssetsToTrash = await _localAssetRepository.getAssetsFromBackupAlbums(checksums);
      if (localAssetsToTrash.isNotEmpty) {
        final mediaUrls = await Future.wait(
          localAssetsToTrash.values
              .expand((e) => e)
              .map((localAsset) => _storageRepository.getAssetEntityForAsset(localAsset).then((e) => e?.getMediaUrl())),
        );
        _logger.info("Moving to trash ${mediaUrls.join(", ")} assets");
        final result = await _localFilesManager.moveToTrash(mediaUrls.nonNulls.toList());
        if (result) {
          await _trashedLocalAssetRepository.trashLocalAsset(localAssetsToTrash);
        }
      } else {
        _logger.info("No assets found in backup-enabled albums for assets: $checksums");
      }
    }
  }
}

