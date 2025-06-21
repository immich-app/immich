import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/services/local_files_manager.service.dart';

final localFilesManagerRepositoryProvider = Provider(
  (ref) =>
      LocalFilesManagerRepository(ref.watch(localFileManagerServiceProvider)),
);

class LocalFilesManagerRepository {
  LocalFilesManagerRepository(this._service);

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
}
