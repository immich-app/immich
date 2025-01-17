import 'dart:io';

import 'package:background_downloader/background_downloader.dart';
import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/extensions/string_extensions.dart';
import 'package:immich_mobile/models/upload/share_intent_attachment.model.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/services/share_intent_service.dart';
import 'package:immich_mobile/services/upload.service.dart';

final shareIntentUploadProvider = StateNotifierProvider<
    ShareIntentUploadStateNotifier, List<ShareIntentAttachment>>(
  ((ref) => ShareIntentUploadStateNotifier(
        ref.watch(appRouterProvider),
        ref.watch(uploadServiceProvider),
        ref.watch(shareIntentServiceProvider),
      )),
);

class ShareIntentUploadStateNotifier
    extends StateNotifier<List<ShareIntentAttachment>> {
  final AppRouter router;
  final UploadService _uploadService;
  final ShareIntentService _shareIntentService;

  ShareIntentUploadStateNotifier(
    this.router,
    this._uploadService,
    this._shareIntentService,
  ) : super([]) {
    _uploadService.onUploadStatus = _uploadStatusCallback;
    _uploadService.onTaskProgress = _taskProgressCallback;
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
    final updatedState =
        state.where((element) => element != attachment).toList();
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
          if (kDebugMode) {
            debugPrint("[COMPLETE] ${update.task.taskId} - DUPLICATE");
          }
        } else {
          if (kDebugMode) {
            debugPrint("[COMPLETE] ${update.task.taskId}");
          }
        }
        break;

      default:
        break;
    }
  }

  void _taskProgressCallback(TaskProgressUpdate update) {
    // Ignore if the task is cancled or completed
    if (update.progress == downloadFailed ||
        update.progress == downloadCompleted) {
      return;
    }

    final taskId = update.task.taskId;
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
