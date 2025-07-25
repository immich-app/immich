import 'dart:async';
import 'dart:io';

import 'package:background_downloader/background_downloader.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/repositories/upload.repository.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:path/path.dart';

final uploadServiceProvider = Provider((ref) {
  final service = UploadService(ref.watch(uploadRepositoryProvider));
  ref.onDispose(service.dispose);
  return service;
});

class UploadService {
  final UploadRepository _uploadRepository;
  void Function(TaskStatusUpdate)? onUploadStatus;
  void Function(TaskProgressUpdate)? onTaskProgress;

  final StreamController<TaskStatusUpdate> _taskStatusController = StreamController<TaskStatusUpdate>.broadcast();
  final StreamController<TaskProgressUpdate> _taskProgressController = StreamController<TaskProgressUpdate>.broadcast();

  Stream<TaskStatusUpdate> get taskStatusStream => _taskStatusController.stream;
  Stream<TaskProgressUpdate> get taskProgressStream => _taskProgressController.stream;

  UploadService(
    this._uploadRepository,
  ) {
    _uploadRepository.onUploadStatus = _onUploadCallback;
    _uploadRepository.onTaskProgress = _onTaskProgressCallback;
  }

  void _onTaskProgressCallback(TaskProgressUpdate update) {
    onTaskProgress?.call(update);
    if (!_taskProgressController.isClosed) {
      _taskProgressController.add(update);
    }
  }

  void _onUploadCallback(TaskStatusUpdate update) {
    onUploadStatus?.call(update);
    if (!_taskStatusController.isClosed) {
      _taskStatusController.add(update);
    }
  }

  void dispose() {
    _taskStatusController.close();
    _taskProgressController.close();
  }

  Future<bool> cancelUpload(String id) {
    return FileDownloader().cancelTaskWithId(id);
  }

  Future<void> cancelAllForGroup(String group) async {
    await _uploadRepository.cancelAll(group);
    await _uploadRepository.reset(group);
    await _uploadRepository.deleteAllTrackingRecords(group);
  }

  void enqueueTasks(List<UploadTask> tasks) {
    _uploadRepository.enqueueAll(tasks);
  }

  Future<UploadTask> buildUploadTask(
    File file, {
    required String group,
    Map<String, String>? fields,
    String? originalFileName,
    String? deviceAssetId,
    String? metadata,
    int? priority,
  }) async {
    return _buildTask(
      deviceAssetId ?? hash(file.path).toString(),
      file,
      fields: fields,
      originalFileName: originalFileName,
      metadata: metadata,
      group: group,
      priority: priority,
    );
  }

  Future<UploadTask> _buildTask(
    String id,
    File file, {
    required String group,
    Map<String, String>? fields,
    String? originalFileName,
    String? metadata,
    int? priority,
  }) async {
    final serverEndpoint = Store.get(StoreKey.serverEndpoint);
    final url = Uri.parse('$serverEndpoint/assets').toString();
    final headers = ApiService.getRequestHeaders();
    final deviceId = Store.get(StoreKey.deviceId);

    final (baseDirectory, directory, filename) = await Task.split(filePath: file.path);
    final stats = await file.stat();
    final fileCreatedAt = stats.changed;
    final fileModifiedAt = stats.modified;
    final fieldsMap = {
      'filename': originalFileName ?? filename,
      'deviceAssetId': id,
      'deviceId': deviceId,
      'fileCreatedAt': fileCreatedAt.toUtc().toIso8601String(),
      'fileModifiedAt': fileModifiedAt.toUtc().toIso8601String(),
      'isFavorite': 'false',
      'duration': '0',
      if (fields != null) ...fields,
    };

    return UploadTask(
      taskId: id,
      displayName: originalFileName ?? filename,
      httpRequestMethod: 'POST',
      url: url,
      headers: headers,
      filename: filename,
      fields: fieldsMap,
      baseDirectory: baseDirectory,
      directory: directory,
      fileField: 'assetData',
      metaData: metadata ?? '',
      group: group,
      priority: priority ?? 5,
      updates: Updates.statusAndProgress,
      retries: 3,
    );
  }
}
