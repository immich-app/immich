import 'package:background_downloader/background_downloader.dart';

abstract interface class IUploadRepository {
  void Function(TaskStatusUpdate)? onUploadStatus;
  void Function(TaskProgressUpdate)? onTaskProgress;

  void enqueueAll(List<UploadTask> tasks);
  Future<bool> cancel(String id);
  Future<bool> cancelAll(String group);
  Future<void> pauseAll(String group);
  Future<void> deleteAllTrackingRecords(String group);
  Future<void> deleteRecordsWithIds(List<String> id);
  Future<List<TaskRecord>> getRecords([TaskStatus? status]);
}
