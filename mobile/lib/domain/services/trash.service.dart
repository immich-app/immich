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
  final Logger _logger = Logger('TrashService');

  TrashService({
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

  Future<void> handleRemoteChanges(Iterable<({String checksum, DateTime? deletedAt})> syncItems) async {
    if (!_platform.isAndroid || !_appSettingsService.getSetting<bool>(AppSettingsEnum.manageLocalMediaAndroid)) {
      return Future.value();
    }
    final trashedAssetsChecksums = syncItems
        .where((item) => item.deletedAt != null)
        .map((syncItem) => syncItem.checksum);
    await applyRemoteTrashToLocal(trashedAssetsChecksums);
    final modifiedAssetsChecksums = syncItems
        .where((item) => item.deletedAt == null)
        .map((syncItem) => syncItem.checksum);
    await applyRemoteRestoreToLocal(modifiedAssetsChecksums);
  }

  Future<void> applyRemoteTrashToLocal(Iterable<String> trashedAssetsChecksums) async {
    if (trashedAssetsChecksums.isNotEmpty) {
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
  }

  Future<void> applyRemoteRestoreToLocal(Iterable<String> modifiedAssetsChecksums) async {
    if (modifiedAssetsChecksums.isNotEmpty) {
      final remoteAssetsToRestore = await _remoteAssetRepository.getByChecksums(
        modifiedAssetsChecksums,
        isTrashed: true,
      );
      if (remoteAssetsToRestore.isNotEmpty) {
        _logger.info("Restoring from trash ${remoteAssetsToRestore.map((e) => e.name).join(", ")} assets");
        await Future.wait(
          remoteAssetsToRestore.map((asset) => _localFilesManager.restoreFromTrash(asset.name, asset.type.index)),
        );
      }
    }
  }
}
