import 'package:background_downloader/background_downloader.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/constants.dart';

final uploadRepositoryProvider = Provider((ref) => UploadRepository());

class UploadRepository {
  void Function(TaskStatusUpdate)? onUploadStatus;

  void Function(TaskProgressUpdate)? onTaskProgress;

  final taskQueue = MemoryTaskQueue();

  UploadRepository() {
    taskQueue.minInterval = const Duration(milliseconds: 25);
    taskQueue.maxConcurrent = 5;
    taskQueue.maxConcurrentByHost = 5;
    taskQueue.maxConcurrentByGroup = 5;

    FileDownloader().addTaskQueue(taskQueue);
    FileDownloader().registerCallbacks(
      group: kBackupGroup,
      taskStatusCallback: (update) => onUploadStatus?.call(update),
      taskProgressCallback: (update) => onTaskProgress?.call(update),
    );
    FileDownloader().registerCallbacks(
      group: kBackupLivePhotoGroup,
      taskStatusCallback: (update) => onUploadStatus?.call(update),
      taskProgressCallback: (update) => onTaskProgress?.call(update),
    );

    taskQueue.enqueueErrors.listen((error) {
      // Handle errors from the task queue
      // You can log them or take appropriate actions
      print('Task Queue Error: $error');
    });
  }

  void enqueueAll(List<UploadTask> tasks) {
    taskQueue.addAll(tasks);
  }

  Future<void> deleteAllTrackingRecords(String group) {
    return FileDownloader().database.deleteAllRecords(group: group);
  }

  Future<bool> cancel(String id) {
    return FileDownloader().cancelTaskWithId(id);
  }

  Future<bool> cancelAll(String group) {
    taskQueue.removeTasksWithGroup(group);
    return FileDownloader().cancelAll(group: group);
  }

  Future<void> pauseAll(String group) {
    return FileDownloader().pauseAll(group: group);
  }

  Future<void> deleteRecordsWithIds(List<String> ids) {
    return FileDownloader().database.deleteRecordsWithIds(ids);
  }

  Future<List<TaskRecord>> getRecords([TaskStatus? status]) {
    if (status == null) {
      return FileDownloader().database.allRecords(group: kBackupGroup);
    }

    return FileDownloader().database.allRecordsWithStatus(status);
  }
}
