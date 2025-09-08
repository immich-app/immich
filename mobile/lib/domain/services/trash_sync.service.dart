import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/remote_asset.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/storage.repository.dart';
import 'package:immich_mobile/repositories/local_files_manager.repository.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:logging/logging.dart';
import 'package:platform/platform.dart';

typedef TrashSyncItem = ({String checksum, DateTime? deletedAt});

class TrashSyncService {
  final AppSettingsService _appSettingsService;
  final RemoteAssetRepository _remoteAssetRepository;
  final DriftLocalAssetRepository _localAssetRepository;
  final LocalFilesManagerRepository _localFilesManager;
  final StorageRepository _storageRepository;
  final Platform _platform;
  final Logger _logger = Logger('TrashService');

  TrashSyncService({
    required AppSettingsService appSettingsService,
    required RemoteAssetRepository remoteAssetRepository,
    required DriftLocalAssetRepository localAssetRepository,
    required LocalFilesManagerRepository localFilesManager,
    required StorageRepository storageRepository,
  }) : _appSettingsService = appSettingsService,
       _remoteAssetRepository = remoteAssetRepository,
       _localAssetRepository = localAssetRepository,
       _localFilesManager = localFilesManager,
       _storageRepository = storageRepository,
       _platform = const LocalPlatform();

  Future<void> handleRemoteChanges(Iterable<TrashSyncItem> syncItems) async {
    if (!_platform.isAndroid || !_appSettingsService.getSetting<bool>(AppSettingsEnum.manageLocalMediaAndroid)) {
      return Future.value();
    }
    final trashedAssetsChecksums = <String>{};
    final modifiedAssetsChecksums = <String>{};
    for (var syncItem in syncItems) {
      if (syncItem.deletedAt != null) {
        trashedAssetsChecksums.add(syncItem.checksum);
      } else {
        modifiedAssetsChecksums.add(syncItem.checksum);
      }
    }
    await _applyRemoteTrashToLocal(trashedAssetsChecksums);
    await _applyRemoteRestoreToLocal(modifiedAssetsChecksums);
  }

  Future<void> _applyRemoteTrashToLocal(Iterable<String> trashedAssetsChecksums) async {
    if (trashedAssetsChecksums.isEmpty) {
      return Future.value();
    } else {
      final localAssetsToTrash = await _localAssetRepository.getBackupSelectedAssets(trashedAssetsChecksums);
      if (localAssetsToTrash.isNotEmpty) {
        final mediaUrls = await Future.wait(
          localAssetsToTrash.map(
            (localAsset) => _storageRepository.getAssetEntityForAsset(localAsset).then((e) => e?.getMediaUrl()),
          ),
        );
        _logger.info("Moving to trash ${mediaUrls.join(", ")} assets");
        await _localFilesManager.moveToTrash(mediaUrls.nonNulls.toList());
        await _localAssetRepository.delete(localAssetsToTrash.map((asset) => asset.id));
      } else {
        _logger.info("No assets found in backup-enabled albums for checksums: $trashedAssetsChecksums");
      }
    }
  }

  Future<void> _applyRemoteRestoreToLocal(Iterable<String> modifiedAssetsChecksums) async {
    if (modifiedAssetsChecksums.isEmpty) {
      return Future.value();
    } else {
      final remoteAssetsToRestore = await _remoteAssetRepository.getByChecksums(
        modifiedAssetsChecksums,
        isTrashed: true,
      );
      if (remoteAssetsToRestore.isNotEmpty) {
        _logger.info(
          "Restoring from trash ${remoteAssetsToRestore.map((e) => "${e.name}/${e.checksum}").join(", ")} assets",
        );
        for (RemoteAsset asset in remoteAssetsToRestore) {
          await _localFilesManager.restoreFromTrash(asset.name, asset.type.index, asset.checksum!);
        }
      }
    }
  }
}
