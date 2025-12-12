import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/services/local_files_manager.service.dart';
import 'package:logging/logging.dart';

final localFilesManagerRepositoryProvider = Provider(
  (ref) => LocalFilesManagerRepository(ref.watch(localFileManagerServiceProvider)),
);

class LocalFilesManagerRepository {
  LocalFilesManagerRepository(this._service);

  final Logger _logger = Logger('SyncStreamService');
  final LocalFilesManagerService _service;

  Future<bool> moveToTrash(List<String> mediaUrls) async {
    return await _service.moveToTrash(mediaUrls);
  }

  Future<bool> restoreFromTrash(String fileName, int type) async {
    return await _service.restoreFromTrash(fileName, type);
  }

  Future<bool> requestManageMediaPermission() async {
    return await _service.requestManageMediaPermission();
  }

  Future<bool> hasManageMediaPermission() async {
    return await _service.hasManageMediaPermission();
  }

  Future<bool> manageMediaPermission() async {
    return await _service.manageMediaPermission();
  }

  Future<List<String>> restoreAssetsFromTrash(Iterable<LocalAsset> assets) async {
    final restoredIds = <String>[];
    for (final asset in assets) {
      _logger.info("Restoring from trash, localId: ${asset.id}, remoteId: ${asset.checksum}");
      try {
        await _service.restoreFromTrashById(asset.id, asset.type.index);
        restoredIds.add(asset.id);
      } catch (e) {
        _logger.warning("Restoring failure: $e");
      }
    }
    return restoredIds;
  }
}
