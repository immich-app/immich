import 'package:background_downloader/background_downloader.dart';
import 'package:flutter_cache_manager/file.dart';
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
      group: kUploadGroup,
      taskStatusCallback: (update) => onUploadStatus?.call(update),
      taskProgressCallback: (update) => onTaskProgress?.call(update),
    );
  }

  @override
  void enqueueAll(List<UploadTask> tasks) {
    taskQueue.addAll(tasks);
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
  void cancelAll() {
    return taskQueue.removeAll();
  }

  @override
  Future<void> pauseAll() {
    return FileDownloader().pauseAll(group: kUploadGroup);
  }

  @override
  Future<void> deleteRecordsWithIds(List<String> ids) {
    return FileDownloader().database.deleteRecordsWithIds(ids);
  }

  @override
  Future<List<TaskRecord>> getRecords([TaskStatus? status]) {
    if (status == null) {
      return FileDownloader().database.allRecords(group: kUploadGroup);
    }

    return FileDownloader().database.allRecordsWithStatus(status);
  }
}
