import 'package:background_downloader/background_downloader.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/utils/upload.dart';

final uploadRepositoryProvider = Provider((ref) => UploadRepository());

class UploadRepository {
  void Function(TaskStatusUpdate)? onUploadStatus;

  void Function(TaskProgressUpdate)? onTaskProgress;

  UploadRepository() {
    FileDownloader().registerCallbacks(
      group: uploadGroup,
      taskStatusCallback: (update) => onUploadStatus?.call(update),
      taskProgressCallback: (update) => onTaskProgress?.call(update),
    );
  }

  Future<bool> upload(UploadTask task) {
    return FileDownloader().enqueue(task);
  }

  Future<void> deleteAllTrackingRecords() {
    return FileDownloader().database.deleteAllRecords();
  }

  Future<bool> cancel(String id) {
    return FileDownloader().cancelTaskWithId(id);
  }

  Future<void> deleteRecordsWithIds(List<String> ids) {
    return FileDownloader().database.deleteRecordsWithIds(ids);
  }
}
