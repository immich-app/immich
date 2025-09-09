import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/local_trashed_asset.model.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/remote_asset.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/storage.repository.dart';
import 'package:immich_mobile/repositories/local_files_manager.repository.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:logging/logging.dart';
import 'package:platform/platform.dart';

typedef TrashSyncItem = ({String remoteId, String checksum, DateTime? deletedAt});

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
    final trashedAssetsItems = <TrashSyncItem>[];
    final modifiedAssetsChecksums = <String>{};
    for (var syncItem in syncItems) {
      if (syncItem.deletedAt != null) {
        trashedAssetsItems.add(syncItem);
      } else {
        modifiedAssetsChecksums.add(syncItem.checksum);
      }
    }
    await _applyRemoteTrashToLocal(trashedAssetsItems);
    await _applyRemoteRestoreToLocal(modifiedAssetsChecksums);
  }

  Future<void> _applyRemoteTrashToLocal(Iterable<TrashSyncItem> trashedAssets) async {
    if (trashedAssets.isEmpty) {
      return Future.value();
    } else {
      final trashedAssetsMap = <String, String>{for (final e in trashedAssets) e.checksum: e.remoteId};
      final localAssetsToTrash = await _localAssetRepository.getBackupSelectedAssets(trashedAssetsMap.keys);
      if (localAssetsToTrash.isNotEmpty) {
        final mediaUrls = await Future.wait(
          localAssetsToTrash.map(
            (localAsset) => _storageRepository.getAssetEntityForAsset(localAsset).then((e) => e?.getMediaUrl()),
          ),
        );
        _logger.info("Moving to trash ${mediaUrls.join(", ")} assets");
        await _localFilesManager.moveToTrash(mediaUrls.nonNulls.toList());
        final itemsToTrash = <LocalRemoteIds>[];
        for (final asset in localAssetsToTrash) {
          final remoteId = trashedAssetsMap[asset.checksum]!;
          itemsToTrash.add((localId: asset.id, remoteId: remoteId));
        }
        await _localAssetRepository.trash(itemsToTrash);
      } else {
        _logger.info("No assets found in backup-enabled albums for assets: $trashedAssetsMap");
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
        final remoteAssetMap = <String, AssetType>{for (final e in remoteAssetsToRestore) e.id: e.type};
        _logger.info("remoteAssetsToRestore: $remoteAssetMap");
        final localTrashedAssets = await _localAssetRepository.getLocalTrashedAssets(remoteAssetMap.keys);
        if (localTrashedAssets.isNotEmpty) {
          for (final LocalTrashedAsset asset in localTrashedAssets) {
            _logger.info("Restoring from trash, localId: ${asset.localId}, remoteId: ${asset.remoteId}");
            final type = remoteAssetMap[asset.remoteId]!;
            await _localFilesManager.restoreFromTrashById(asset.localId, type.index);
            await _localAssetRepository.deleteLocalTrashedAssets(remoteAssetMap.keys);
          }
        } else {
          _logger.info("No local assets found for restoration");
        }
      } else {
        _logger.info("No remote assets found for restoration");
      }
    }
  }
}
