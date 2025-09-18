import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/asset/trashed_asset.model.dart';
import 'package:immich_mobile/extensions/platform_extensions.dart';
import 'package:immich_mobile/infrastructure/repositories/local_album.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/storage.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/trashed_local_asset.repository.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';
import 'package:immich_mobile/repositories/local_files_manager.repository.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/utils/datetime_helpers.dart';
import 'package:logging/logging.dart';

typedef TrashSyncItem = ({String remoteId, String checksum, DateTime? deletedAt});

class TrashSyncService {
  final AppSettingsService _appSettingsService;
  final NativeSyncApi _nativeSyncApi;
  final DriftLocalAssetRepository _localAssetRepository;
  final DriftLocalAlbumRepository _localAlbumRepository;
  final DriftTrashedLocalAssetRepository _trashedLocalAssetRepository;
  final LocalFilesManagerRepository _localFilesManager;
  final StorageRepository _storageRepository;
  final Logger _logger = Logger('TrashService');

  TrashSyncService({
    required AppSettingsService appSettingsService,
    required NativeSyncApi nativeSyncApi,
    required DriftLocalAssetRepository localAssetRepository,
    required DriftLocalAlbumRepository localAlbumRepository,
    required DriftTrashedLocalAssetRepository trashedLocalAssetRepository,
    required LocalFilesManagerRepository localFilesManager,
    required StorageRepository storageRepository,
  }) : _appSettingsService = appSettingsService,
       _nativeSyncApi = nativeSyncApi,
       _localAssetRepository = localAssetRepository,
       _localAlbumRepository = localAlbumRepository,
       _trashedLocalAssetRepository = trashedLocalAssetRepository,
       _localFilesManager = localFilesManager,
       _storageRepository = storageRepository;

  bool get isAutoSyncMode =>
      CurrentPlatform.isAndroid && _appSettingsService.getSetting<bool>(AppSettingsEnum.manageLocalMediaAndroid);

  Future<void> updateChecksums(Iterable<TrashedAsset> assets) async =>
      _trashedLocalAssetRepository.updateChecksums(assets);

  Future<Iterable<TrashedAsset>> getAssetsToHash(String albumId) async =>
      _trashedLocalAssetRepository.getToHash(albumId);

  Future<void> updateLocalTrashFromDevice() async {
    final backupAlbums = await _localAlbumRepository.getBackupAlbums();
    if (backupAlbums.isEmpty) {
      _logger.info("No backup albums found");
      return;
    }
    for (final album in backupAlbums) {
      _logger.info("deviceTrashedAssets prepare, album: ${album.id}/${album.name}");
      final deviceTrashedAssets = await _nativeSyncApi.getTrashedAssetsForAlbum(album.id);
      await _trashedLocalAssetRepository.applyTrashSnapshot(deviceTrashedAssets.toTrashedAssets(album.id), album.id);
    }
    // todo find for more suitable place
    await applyRemoteRestoreToLocal();
  }

  Future<void> handleRemoteChanges(Iterable<String> checksums) async {
    if (checksums.isEmpty) {
      return Future.value();
    } else {
      final localAssetsToTrash = await _localAssetRepository.getBackupSelectedAssetsByAlbum(checksums);
      if (localAssetsToTrash.isNotEmpty) {
        final mediaUrls = await Future.wait(
          localAssetsToTrash.values
              .expand((e) => e)
              .map((localAsset) => _storageRepository.getAssetEntityForAsset(localAsset).then((e) => e?.getMediaUrl())),
        );
        _logger.info("Moving to trash ${mediaUrls.join(", ")} assets");
        final result = await _localFilesManager.moveToTrash(mediaUrls.nonNulls.toList());
        if (result) {
          await _localAssetRepository.trash(localAssetsToTrash);
        }
      } else {
        _logger.info("No assets found in backup-enabled albums for assets: $checksums");
      }
    }
  }

  Future<void> applyRemoteRestoreToLocal() async {
    final remoteAssetsToRestore = await _trashedLocalAssetRepository.getToRestore();
    if (remoteAssetsToRestore.isNotEmpty) {
      _logger.info("remoteAssetsToRestore: $remoteAssetsToRestore");
      for (final asset in remoteAssetsToRestore) {
        _logger.info("Restoring from trash, localId: ${asset.id}, remoteId: ${asset.checksum}");
        await _localFilesManager.restoreFromTrashById(asset.id, asset.type.index);
      }
      // todo It`s necessary? could cause race with deletion in applyTrashSnapshot? 18/09/2025
      await _trashedLocalAssetRepository.delete(remoteAssetsToRestore.map((e) => e.id));
    } else {
      _logger.info("No remote assets found for restoration");
    }
  }
}

extension on Iterable<PlatformAsset> {
  List<TrashedAsset> toTrashedAssets(String albumId) {
    return map(
      (e) => TrashedAsset(
        id: e.id,
        name: e.name,
        checksum: null,
        type: AssetType.values.elementAtOrNull(e.type) ?? AssetType.other,
        createdAt: tryFromSecondsSinceEpoch(e.createdAt) ?? DateTime.now(),
        updatedAt: tryFromSecondsSinceEpoch(e.updatedAt) ?? DateTime.now(),
        size: e.size,
        albumId: albumId,
      ),
    ).toList();
  }
}
