import 'package:background_downloader/background_downloader.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/interfaces/upload.interface.dart';
import 'package:immich_mobile/utils/upload.dart';

final uploadRepositoryProvider = Provider((ref) => UploadRepository());

class UploadRepository implements IUploadRepository {
  @override
  void Function(TaskStatusUpdate)? onUploadStatus;

  @override
  void Function(TaskProgressUpdate)? onTaskProgress;

  final taskQueue = MemoryTaskQueue();

  UploadRepository() {
    taskQueue.minInterval = const Duration(milliseconds: 5);
    taskQueue.maxConcurrent = 5;
    FileDownloader().addTaskQueue(taskQueue);
    FileDownloader().registerCallbacks(
      group: uploadGroup,
      taskStatusCallback: (update) => onUploadStatus?.call(update),
      taskProgressCallback: (update) => onTaskProgress?.call(update),
    );
  }

  @override
  void enqueue(UploadTask task) {
    taskQueue.add(task);
  }

  @override
  Future<void> deleteAllTrackingRecords() {
    return FileDownloader().database.deleteAllRecords();
  }

  @override
  Future<bool> cancel(String id) {
    return FileDownloader().cancelTaskWithId(id);
  }

  @override
  Future<void> deleteRecordsWithIds(List<String> ids) {
    return FileDownloader().database.deleteRecordsWithIds(ids);
  }
}
