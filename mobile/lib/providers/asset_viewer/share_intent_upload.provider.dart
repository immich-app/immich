import 'dart:io';

import 'package:background_downloader/background_downloader.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/string_extensions.dart';
import 'package:immich_mobile/models/upload/share_intent_attachment.model.dart';
import 'package:immich_mobile/services/upload.service.dart';

final shareIntentUploadProvider = StateNotifierProvider.autoDispose<
    ShareIntentUploadStateNotifier, List<ShareIntentAttachment>>(
  ((ref) => ShareIntentUploadStateNotifier(
        ref.watch(uploadServiceProvider),
      )),
);

class ShareIntentUploadStateNotifier
    extends StateNotifier<List<ShareIntentAttachment>> {
  final UploadService _uploadService;

  ShareIntentUploadStateNotifier(
    this._uploadService,
  ) : super([]) {
    _uploadService.onUploadStatus = _uploadStatusCallback;
    _uploadService.onTaskProgress = _taskProgressCallback;
  }

  void addAttachments(List<ShareIntentAttachment> attachments) {
    state = [...state, ...attachments];
  }

  void removeAttachment(ShareIntentAttachment attachment) {
    state = state.where((element) => element != attachment).toList();
  }

  void clearAttachments() {
    state = [];
  }

  void _updateUploadStatus(TaskStatusUpdate task, TaskStatus status) async {
    if (status == TaskStatus.canceled) {
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
      TaskStatus.waitingToRetry => UploadStatus.waitingtoRetry
    };

    state = [
      for (final attachment in state)
        if (attachment.id == taskId.toInt())
          attachment.copyWith(status: uploadStatus)
        else
          attachment,
    ];
  }

  void _uploadStatusCallback(TaskStatusUpdate update) {
    _updateUploadStatus(update, update.status);

    switch (update.status) {
      case TaskStatus.complete:
        if (update.responseStatusCode == 200) {
          debugPrint("[COMPLETE] ${update.task.taskId} - DUPLICATE");
        } else {
          debugPrint("[COMPLETE] ${update.task.taskId}");
        }
        break;

      default:
        break;
    }
  }

  void _taskProgressCallback(TaskProgressUpdate update) {
    // Ignore if the task is cancled or completed
    if (update.progress == -2 || update.progress == -1) {
      return;
    }

    final taskId = update.task.taskId;
    print('Task progress: $taskId - ${update.progress}');
    state = [
      for (final attachment in state)
        if (attachment.id == taskId.toInt())
          attachment.copyWith(uploadProgress: update.progress)
        else
          attachment,
    ];
  }

  Future<void> upload(File file) {
    return _uploadService.upload(file);
  }

  Future<bool> cancelUpload(String id) {
    return _uploadService.cancelUpload(id);
  }
}
