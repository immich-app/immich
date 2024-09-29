import 'package:background_downloader/background_downloader.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/interfaces/download.interface.dart';
import 'package:immich_mobile/utils/download.dart';

final downloadRepositoryProvider = Provider((ref) => DownloadRepository());

class DownloadRepository implements IDownloadRepository {
  @override
  void Function(TaskStatusUpdate)? onImageDownloadStatus;

  @override
  void Function(TaskStatusUpdate)? onVideoDownloadStatus;

  @override
  void Function(TaskStatusUpdate)? onLivePhotoDownloadStatus;

  @override
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

  @override
  Future<bool> download(DownloadTask task) {
    return FileDownloader().enqueue(task);
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
  Future<List<TaskRecord>> getLiveVideoTasks() {
    return FileDownloader().database.allRecordsWithStatus(
          TaskStatus.complete,
          group: downloadGroupLivePhoto,
        );
  }

  @override
  Future<void> deleteRecordsWithIds(List<String> ids) {
    return FileDownloader().database.deleteRecordsWithIds(ids);
  }
}
