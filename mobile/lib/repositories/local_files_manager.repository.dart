import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/interfaces/local_files_manager.interface.dart';
import 'package:immich_mobile/utils/local_files_manager.dart';

final localFilesManagerRepositoryProvider =
    Provider((ref) => const LocalFilesManagerRepository());

class LocalFilesManagerRepository implements ILocalFilesManager {
  const LocalFilesManagerRepository();

  @override
  Future<bool> moveToTrash(List<String> mediaUrls) async {
    return await LocalFilesManager.moveToTrash(mediaUrls);
  }

  @override
  Future<bool> restoreFromTrash(String fileName, int type) async {
    return await LocalFilesManager.restoreFromTrash(fileName, type);
  }

  @override
  Future<bool> requestManageMediaPermission() async {
    return await LocalFilesManager.requestManageMediaPermission();
  }
}
