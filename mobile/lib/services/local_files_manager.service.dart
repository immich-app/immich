import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';
import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';
import 'package:logging/logging.dart';

final localFileManagerServiceProvider = Provider<LocalFilesManagerService>(
  (ref) => LocalFilesManagerService(ref.watch(nativeSyncApiProvider)),
);

class LocalFilesManagerService {
  const LocalFilesManagerService(this._nativeSyncApi);

  static final Logger _logger = Logger('LocalFilesManager');
  final NativeSyncApi _nativeSyncApi;

  Future<bool> moveToTrash(List<String> mediaUrls) async {
    try {
      return await _nativeSyncApi.moveToTrash(mediaUrls);
    } catch (e, s) {
      _logger.warning('Error moving file to trash', e, s);
      return false;
    }
  }

  Future<bool> restoreFromTrash(String fileName, int type) async {
    try {
      return await _nativeSyncApi.restoreFromTrash(fileName: fileName, type: type);
    } catch (e, s) {
      _logger.warning('Error restore file from trash', e, s);
      return false;
    }
  }

  Future<bool> restoreFromTrashById(String mediaId, int type) async {
    try {
      return await _nativeSyncApi.restoreFromTrash(mediaId: mediaId, type: type);
    } catch (e, s) {
      _logger.warning('Error restore file from trash by Id', e, s);
      return false;
    }
  }

  Future<bool> requestManageMediaPermission() async {
    try {
      return await _nativeSyncApi.requestManageMediaPermission();
    } catch (e, s) {
      _logger.warning('Error requesting manage media permission', e, s);
      return false;
    }
  }

  Future<bool> hasManageMediaPermission() async {
    try {
      return await _nativeSyncApi.hasManageMediaPermission();
    } catch (e, s) {
      _logger.warning('Error requesting manage media permission state', e, s);
      return false;
    }
  }

  Future<bool> manageMediaPermission() async {
    try {
      return await _nativeSyncApi.requestManageMediaPermission();
    } catch (e, s) {
      _logger.warning('Error requesting manage media permission settings', e, s);
      return false;
    }
  }
}
