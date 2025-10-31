import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/trash_sync.model.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/remote_asset.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/storage.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/trash_sync.repository.dart';
import 'package:immich_mobile/repositories/local_files_manager.repository.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:logging/logging.dart';
import 'package:platform/platform.dart';

typedef TrashSyncItem = ({String checksum, DateTime? deletedAt});
typedef ReviewItem = ({String localAssetId, String checksum});

class TrashSyncService {
  final AppSettingsService _appSettingsService;
  final RemoteAssetRepository _remoteAssetRepository;
  final DriftLocalAssetRepository _localAssetRepository;
  final LocalFilesManagerRepository _localFilesManager;
  final StorageRepository _storageRepository;
  final DriftTrashSyncRepository _trashSyncRepository;
  final Platform _platform;
  final Logger _logger = Logger('TrashSyncService');

  TrashSyncService({
    required AppSettingsService appSettingsService,
    required RemoteAssetRepository remoteAssetRepository,
    required DriftLocalAssetRepository localAssetRepository,
    required LocalFilesManagerRepository localFilesManager,
    required StorageRepository storageRepository,
    required DriftTrashSyncRepository trashSyncRepository,
  }) : _appSettingsService = appSettingsService,
       _remoteAssetRepository = remoteAssetRepository,
       _localAssetRepository = localAssetRepository,
       _localFilesManager = localFilesManager,
       _storageRepository = storageRepository,
       _trashSyncRepository = trashSyncRepository,
       _platform = const LocalPlatform();

  bool get isServiceEnabled => isAutoSyncMode || isReviewMode;

  bool get isAutoSyncMode =>
      _platform.isAndroid && _appSettingsService.getSetting<bool>(AppSettingsEnum.manageLocalMediaAndroid);

  bool get isReviewMode =>
      _platform.isAndroid && _appSettingsService.getSetting<bool>(AppSettingsEnum.reviewOutOfSyncChangesAndroid);

  Stream<int> watchPendingApprovalCount() => _trashSyncRepository.watchPendingApprovalCount();

  Stream<Set<String>> watchPendingApprovalChecksums() => _trashSyncRepository.watchPendingApprovalChecksums();

  Future<bool> resolveRemoteTrash(Iterable<String> remoteChecksums, {required bool allow}) async {
    await _trashSyncRepository.updateApproves(remoteChecksums, allow);
    if (allow) {
      return await _applyRemoteTrash(remoteChecksums, true);
    }
    return true;
  }

  Future<void> handleRemoteChanges(Iterable<TrashSyncItem> syncItems) async {
    final trashedAssetsChecksums = <String>[];
    final modifiedAssetsChecksums = <String>[];
    for (var syncItem in syncItems) {
      if (syncItem.deletedAt != null) {
        trashedAssetsChecksums.add(syncItem.checksum);
      } else {
        modifiedAssetsChecksums.add(syncItem.checksum);
      }
    }
    await _applyRemoteTrash(trashedAssetsChecksums, isAutoSyncMode);
    await _applyRemoteRestore(modifiedAssetsChecksums);
  }

  Future<bool> _applyRemoteTrash(Iterable<String> trashedAssetsChecksums, bool allowToTrash) async {
    if (trashedAssetsChecksums.isEmpty) {
      return Future.value(false);
    }
    final localAssetsToTrash = await _localAssetRepository.getByChecksums(trashedAssetsChecksums);
    if (localAssetsToTrash.isEmpty) {
      return false;
    }
    if (allowToTrash) {
      return await _applyRemoteTrashToLocal(localAssetsToTrash);
    } else {
      // await _applyRemoteTrashToReview(localAssetsToTrash);
      return true;
    }
  }

  Future<bool> _applyRemoteTrashToLocal(List<LocalAsset> localAssetsToTrash) async {
    final mediaUrls = await Future.wait(
      localAssetsToTrash.map(
        (localAsset) => _storageRepository.getAssetEntityForAsset(localAsset).then((e) => e?.getMediaUrl()),
      ),
    );
    _logger.info("Moving assets to trash: ${mediaUrls.join(", ")}");
    if (mediaUrls.isEmpty) {
      return false;
    }
    return await _localFilesManager.moveToTrash(mediaUrls.nonNulls.toList());
  }

  // Future<void> _applyRemoteTrashToReview(List<LocalAsset> localAssetsToTrash) async {
  //   final itemsToReview = localAssetsToTrash
  //       .map<ReviewItem>((la) => (localAssetId: la.id, checksum: la.checksum ?? ''))
  //       .where((la) => la.checksum.isNotEmpty);
  //   _logger.info("Apply remote trash action to review for: $itemsToReview");
  //   return _trashSyncRepository.insertIfNotExists(itemsToReview, TrashActionType.delete);
  // }

  Future<void> _applyRemoteRestore(Iterable<String> modifiedAssetsChecksums) async {
    final remoteAssetsToRestore = await _remoteAssetRepository.getByChecksums(modifiedAssetsChecksums, isTrashed: true);
    if (remoteAssetsToRestore.where((e) => e.checksum != null).isEmpty) {
      return;
    }
    if (isAutoSyncMode) {
      _logger.info("Restoring from trash ${remoteAssetsToRestore.map((e) => e.name).join(", ")} assets");
      await Future.wait(
        remoteAssetsToRestore.map((asset) => _localFilesManager.restoreFromTrash(asset.name, asset.type.index)),
      );
    } else {
      final checksums = remoteAssetsToRestore.map((e) => e.checksum).nonNulls;
      _logger.info("Clear unapproved trash sync for: $checksums");
      await _trashSyncRepository.deleteUnapproved(checksums);
    }
  }
}
