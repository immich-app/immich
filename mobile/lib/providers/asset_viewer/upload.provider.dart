import 'dart:io';

import 'package:background_downloader/background_downloader.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/services/upload.service.dart';

final uploadStateProvider = StateNotifierProvider<UploadStateNotifier, int>(
  ((ref) => UploadStateNotifier(
        ref.watch(uploadServiceProvider),
      )),
);

class UploadStateNotifier extends StateNotifier<int> {
  final UploadService _uploadService;

  UploadStateNotifier(
    this._uploadService,
  ) : super(0) {
    _uploadService.onUploadStatus = _uploadStatusCallback;
    _uploadService.onTaskProgress = _taskProgressCallback;
  }

  void _uploadStatusCallback(TaskStatusUpdate update) {
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
    debugPrint("[PROGRESS] $update");
    // Ignore if the task is cancled or completed
    if (update.progress == -2 || update.progress == -1) {
      return;
    }
  }

  Future<void> upload(File file) {
    return _uploadService.upload(file);
  }

  Future<bool> cancelUpload(String id) {
    return _uploadService.cancelUpload(id);
  }
}
