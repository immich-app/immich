import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/interfaces/local_files_manager.interface.dart';
import 'package:immich_mobile/utils/local_files_manager.dart';

final localFilesManagerRepositoryProvider =
    Provider((ref) => LocalFilesManagerRepository());

class LocalFilesManagerRepository implements ILocalFilesManager {
  @override
  Future<bool> moveToTrash(String fileName) async {
    return await LocalFilesManager.moveToTrash(fileName);
  }

  @override
  Future<bool> restoreFromTrash(String fileName) async {
    return await LocalFilesManager.restoreFromTrash(fileName);
  }
}
