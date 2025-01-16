import 'dart:io';

import 'package:background_downloader/background_downloader.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/interfaces/upload.interface.dart';
import 'package:immich_mobile/repositories/upload.repository.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/utils/upload.dart';
import 'package:path/path.dart';
// import 'package:logging/logging.dart';

final uploadServiceProvider = Provider(
  (ref) => UploadService(
    ref.watch(uploadRepositoryProvider),
  ),
);

class UploadService {
  final IUploadRepository _uploadRepository;
  // final Logger _log = Logger("UploadService");
  void Function(TaskStatusUpdate)? onUploadStatus;
  void Function(TaskProgressUpdate)? onTaskProgress;

  UploadService(
    this._uploadRepository,
  ) {
    _uploadRepository.onUploadStatus = _onUploadCallback;
    _uploadRepository.onTaskProgress = _onTaskProgressCallback;
  }

  void _onTaskProgressCallback(TaskProgressUpdate update) {
    onTaskProgress?.call(update);
  }

  void _onUploadCallback(TaskStatusUpdate update) {
    onUploadStatus?.call(update);
  }

  Future<bool> cancelUpload(String id) {
    return FileDownloader().cancelTaskWithId(id);
  }

  Future<void> upload(File file) async {
    final task = await _buildUploadTask(
      hash(file.path).toString(),
      file,
    );

    await _uploadRepository.upload(task);
  }

  Future<UploadTask> _buildUploadTask(
    String id,
    File file, {
    Map<String, String>? fields,
  }) async {
    final serverEndpoint = Store.get(StoreKey.serverEndpoint);
    final url = Uri.parse('$serverEndpoint/assets').toString();
    final headers = ApiService.getRequestHeaders();
    final deviceId = Store.get(StoreKey.deviceId);

    final (baseDirectory, directory, filename) =
        await Task.split(filePath: file.path);
    final stats = await file.stat();
    final fileCreatedAt = stats.changed;
    final fileModifiedAt = stats.modified;

    final fieldsMap = {
      'filename': filename,
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
      httpRequestMethod: 'POST',
      url: url,
      headers: headers,
      filename: filename,
      fields: fieldsMap,
      baseDirectory: baseDirectory,
      directory: directory,
      fileField: 'assetData',
      group: uploadGroup,
      updates: Updates.statusAndProgress,
    );
  }
}
