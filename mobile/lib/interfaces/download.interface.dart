import 'package:background_downloader/background_downloader.dart';

abstract interface class IDownloadRepository {
  void Function(TaskStatusUpdate)? onImageDownloadStatus;
  void Function(TaskStatusUpdate)? onVideoDownloadStatus;
  void Function(TaskStatusUpdate)? onLivePhotoDownloadStatus;
  void Function(TaskProgressUpdate)? onTaskProgress;

  Future<List<TaskRecord>> getLiveVideoTasks();
  Future<bool> download(DownloadTask task);
  Future<bool> cancel(String id);
  Future<void> deleteAllTrackingRecords();
  Future<void> deleteRecordsWithIds(List<String> id);
}
