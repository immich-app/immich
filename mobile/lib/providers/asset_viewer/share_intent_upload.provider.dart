import 'dart:io';

import 'package:background_downloader/background_downloader.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/string_extensions.dart';
import 'package:immich_mobile/models/upload/share_intent_attachment.model.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/services/share_intent_service.dart';
import 'package:immich_mobile/services/upload.service.dart';
import 'package:logging/logging.dart';
import 'package:path/path.dart';

final shareIntentUploadProvider = StateNotifierProvider<ShareIntentUploadStateNotifier, List<ShareIntentAttachment>>(
  ((ref) => ShareIntentUploadStateNotifier(
    ref.watch(appRouterProvider),
    ref.watch(uploadServiceProvider),
    ref.watch(shareIntentServiceProvider),
  )),
);

class ShareIntentUploadStateNotifier extends StateNotifier<List<ShareIntentAttachment>> {
  final AppRouter router;
  final UploadService _uploadService;
  final ShareIntentService _shareIntentService;
  final Logger _logger = Logger('ShareIntentUploadStateNotifier');

  ShareIntentUploadStateNotifier(this.router, this._uploadService, this._shareIntentService) : super([]) {
    _uploadService.taskStatusStream.listen(_updateUploadStatus);
    _uploadService.taskProgressStream.listen(_taskProgressCallback);
  }

  void init() {
    _shareIntentService.onSharedMedia = onSharedMedia;
    _shareIntentService.init();
  }

  void onSharedMedia(List<ShareIntentAttachment> attachments) {
    router.removeWhere((route) => route.name == "ShareIntentRoute");
    clearAttachments();
    addAttachments(attachments);
    router.push(ShareIntentRoute(attachments: attachments));
  }

  void addAttachments(List<ShareIntentAttachment> attachments) {
    if (attachments.isEmpty) {
      return;
    }
    state = [...state, ...attachments];
  }

  void removeAttachment(ShareIntentAttachment attachment) {
    final updatedState = state.where((element) => element != attachment).toList();
    if (updatedState.length != state.length) {
      state = updatedState;
    }
  }

  void clearAttachments() {
    if (state.isEmpty) {
      return;
    }

    state = [];
  }

  void _updateUploadStatus(TaskStatusUpdate task) async {
    if (task.status == TaskStatus.canceled) {
      return;
    }

    final taskId = task.task.taskId;
    final uploadStatus = switch (task.status) {
      TaskStatus.complete => UploadStatus.complete,
      TaskStatus.failed => UploadStatus.failed,
      TaskStatus.canceled => UploadStatus.canceled,
      TaskStatus.enqueued => UploadStatus.enqueued,
      TaskStatus.running => UploadStatus.running,
      TaskStatus.paused => UploadStatus.paused,
      TaskStatus.notFound => UploadStatus.notFound,
      TaskStatus.waitingToRetry => UploadStatus.waitingToRetry,
    };

    state = [
      for (final attachment in state)
        if (attachment.id == taskId.toInt()) attachment.copyWith(status: uploadStatus) else attachment,
    ];

    if (task.status == TaskStatus.failed) {
      String? error;
      final exception = task.exception;
      if (exception != null && exception is TaskHttpException) {
        final message = tryJsonDecode(exception.description)?['message'] as String?;
        if (message != null) {
          final responseCode = exception.httpResponseCode;
          error = "${exception.exceptionType}, response code $responseCode: $message";
        }
      }
      error ??= task.exception?.toString();

      _logger.warning("Upload failed for asset: ${task.task.filename}, error: $error");
    }
  }

  void _taskProgressCallback(TaskProgressUpdate update) {
    // Ignore if the task is canceled or completed
    if (update.progress == downloadFailed || update.progress == downloadCompleted) {
      return;
    }

    final taskId = update.task.taskId;
    state = [
      for (final attachment in state)
        if (attachment.id == taskId.toInt()) attachment.copyWith(uploadProgress: update.progress) else attachment,
    ];
  }

  Future<void> upload(File file) async {
    final task = await _buildUploadTask(hash(file.path).toString(), file);

    await _uploadService.enqueueTasks([task]);
  }

  Future<UploadTask> _buildUploadTask(String id, File file, {Map<String, String>? fields}) async {
    final serverEndpoint = Store.get(StoreKey.serverEndpoint);
    final url = Uri.parse('$serverEndpoint/assets').toString();
    final headers = ApiService.getRequestHeaders();
    final deviceId = Store.get(StoreKey.deviceId);

    final (baseDirectory, directory, filename) = await Task.split(filePath: file.path);
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
      group: kManualUploadGroup,
      updates: Updates.statusAndProgress,
    );
  }
}
