import 'package:background_downloader/background_downloader.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/utils/download.dart';

final downloadRepositoryProvider = Provider((ref) => DownloadRepository());

class DownloadRepository {
  void Function(TaskStatusUpdate)? onImageDownloadStatus;

  void Function(TaskStatusUpdate)? onVideoDownloadStatus;

  void Function(TaskStatusUpdate)? onLivePhotoDownloadStatus;

  void Function(TaskProgressUpdate)? onTaskProgress;

  DownloadRepository() {
    FileDownloader().registerCallbacks(
      group: downloadGroupImage,
      taskStatusCallback: (update) => onImageDownloadStatus?.call(update),
      taskProgressCallback: (update) => onTaskProgress?.call(update),
    );

    FileDownloader().registerCallbacks(
      group: downloadGroupVideo,
      taskStatusCallback: (update) => onVideoDownloadStatus?.call(update),
      taskProgressCallback: (update) => onTaskProgress?.call(update),
    );

    FileDownloader().registerCallbacks(
      group: downloadGroupLivePhoto,
      taskStatusCallback: (update) => onLivePhotoDownloadStatus?.call(update),
      taskProgressCallback: (update) => onTaskProgress?.call(update),
    );
  }

  Future<List<bool>> downloadAll(List<DownloadTask> tasks) {
    return FileDownloader().enqueueAll(tasks);
  }

  Future<void> deleteAllTrackingRecords() {
    return FileDownloader().database.deleteAllRecords();
  }

  Future<bool> cancel(String id) {
    return FileDownloader().cancelTaskWithId(id);
  }

  Future<List<TaskRecord>> getLiveVideoTasks() {
    return FileDownloader().database.allRecordsWithStatus(
          TaskStatus.complete,
          group: downloadGroupLivePhoto,
        );
  }

  Future<void> deleteRecordsWithIds(List<String> ids) {
    return FileDownloader().database.deleteRecordsWithIds(ids);
  }
}
