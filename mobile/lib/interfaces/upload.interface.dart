import 'package:background_downloader/background_downloader.dart';

abstract interface class IUploadRepository {
  void Function(TaskStatusUpdate)? onUploadStatus;
  void Function(TaskProgressUpdate)? onTaskProgress;

  void enqueueAll(List<UploadTask> tasks);
  Future<bool> cancel(String id);
  Future<bool> cancelAll();
  Future<void> pauseAll();
  Future<void> deleteAllTrackingRecords();
  Future<void> deleteRecordsWithIds(List<String> id);
  Future<List<TaskRecord>> getRecords([TaskStatus? status]);
}
