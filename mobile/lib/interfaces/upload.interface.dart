import 'package:background_downloader/background_downloader.dart';

abstract interface class IUploadRepository {
  void Function(TaskStatusUpdate)? onUploadStatus;
  void Function(TaskProgressUpdate)? onTaskProgress;

  Future<bool> upload(UploadTask task);
  Future<bool> cancel(String id);
  Future<void> deleteAllTrackingRecords();
  Future<void> deleteRecordsWithIds(List<String> id);
}
