import 'package:background_downloader/background_downloader.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/constants.dart';

final uploadRepositoryProvider = Provider((ref) => UploadRepository());

class UploadRepository {
  void Function(TaskStatusUpdate)? onUploadStatus;

  void Function(TaskProgressUpdate)? onTaskProgress;

  UploadRepository() {
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

  void enqueueAll(List<UploadTask> tasks) {
    FileDownloader().enqueueAll(tasks);
  }

  Future<void> deleteAllTrackingRecords(String group) {
    return FileDownloader().database.deleteAllRecords(group: group);
  }

  Future<bool> cancel(String id) {
    return FileDownloader().cancelTaskWithId(id);
  }

  Future<bool> cancelAll(String group) {
    return FileDownloader().cancelAll(group: group);
  }

  Future<int> reset(String group) {
    return FileDownloader().reset(group: group);
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

  Future<void> resumeUpload() {
    return FileDownloader().start();
  }
}
