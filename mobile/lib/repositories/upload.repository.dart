import 'package:background_downloader/background_downloader.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/interfaces/upload.interface.dart';

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
      group: kBackupGroup,
      taskStatusCallback: (update) => onUploadStatus?.call(update),
      taskProgressCallback: (update) => onTaskProgress?.call(update),
    );
    FileDownloader().registerCallbacks(
      group: kBackupLivePhotoGroup,
      taskStatusCallback: (update) => onUploadStatus?.call(update),
      taskProgressCallback: (update) => onTaskProgress?.call(update),
    );
  }

  @override
  void enqueueAll(List<UploadTask> tasks) {
    taskQueue.addAll(tasks);
  }

  @override
  Future<void> deleteAllTrackingRecords(String group) {
    return FileDownloader().database.deleteAllRecords(group: group);
  }

  @override
  Future<bool> cancel(String id) {
    return FileDownloader().cancelTaskWithId(id);
  }

  @override
  Future<bool> cancelAll(String group) {
    taskQueue.removeTasksWithGroup(group);
    return FileDownloader().cancelAll(group: group);
  }

  @override
  Future<void> pauseAll(String group) {
    return FileDownloader().pauseAll(group: group);
  }

  @override
  Future<void> deleteRecordsWithIds(List<String> ids) {
    return FileDownloader().database.deleteRecordsWithIds(ids);
  }

  @override
  Future<List<TaskRecord>> getRecords([TaskStatus? status]) {
    if (status == null) {
      return FileDownloader().database.allRecords(group: kBackupGroup);
    }

    return FileDownloader().database.allRecordsWithStatus(status);
  }
}
