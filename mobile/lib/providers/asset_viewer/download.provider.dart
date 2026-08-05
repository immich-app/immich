import 'dart:async';

import 'package:background_downloader/background_downloader.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/download/download_state.model.dart';
import 'package:immich_mobile/services/download.service.dart';

class DownloadStateNotifier extends StateNotifier<DownloadState> {
  final DownloadService _downloadService;

  DownloadStateNotifier(this._downloadService)
    : super(
        const DownloadState(
          downloadStatus: TaskStatus.complete,
          showProgress: false,
          taskProgress: <String, DownloadInfo>{},
        ),
      ) {
    _downloadService.onImageDownloadStatus = _downloadStatusCallback;
    _downloadService.onVideoDownloadStatus = _downloadStatusCallback;
    _downloadService.onLivePhotoDownloadStatus = _downloadStatusCallback;
    _downloadService.onTaskProgress = _taskProgressCallback;
  }

  void _updateDownloadStatus(String taskId, TaskStatus status) {
    if (status == TaskStatus.canceled) {
      return;
    }

    state = state.copyWith(
      taskProgress: <String, DownloadInfo>{}
        ..addAll(state.taskProgress)
        ..addAll({
          taskId: DownloadInfo(
            progress: state.taskProgress[taskId]?.progress ?? 0,
            fileName: state.taskProgress[taskId]?.fileName ?? '',
            status: status,
          ),
        }),
    );
  }

  void _downloadStatusCallback(TaskStatusUpdate update) {
    _updateDownloadStatus(update.task.taskId, update.status);

    if (update.status == TaskStatus.complete) {
      _onDownloadComplete(update.task.taskId);
    }
  }

  void _taskProgressCallback(TaskProgressUpdate update) {
    // Ignore if the task is canceled or completed
    if (update.progress == -2 || update.progress == -1) {
      return;
    }

    state = state.copyWith(
      showProgress: true,
      taskProgress: <String, DownloadInfo>{}
        ..addAll(state.taskProgress)
        ..addAll({
          update.task.taskId: DownloadInfo(
            progress: update.progress,
            fileName: update.task.filename,
            status: TaskStatus.running,
          ),
        }),
    );
  }

  void _onDownloadComplete(String id) {
    Future.delayed(const Duration(seconds: 2), () {
      if (!mounted) {
        return;
      }

      state = state.copyWith(
        taskProgress: <String, DownloadInfo>{}
          ..addAll(state.taskProgress)
          ..remove(id),
      );

      if (state.taskProgress.isEmpty) {
        state = state.copyWith(showProgress: false);
      }
    });
  }

  Future<void> cancelDownload(String id) async {
    final isCanceled = await _downloadService.cancelDownload(id);

    if (isCanceled) {
      state = state.copyWith(
        taskProgress: <String, DownloadInfo>{}
          ..addAll(state.taskProgress)
          ..remove(id),
      );
    }

    if (state.taskProgress.isEmpty) {
      state = state.copyWith(showProgress: false);
    }
  }
}

final downloadStateProvider = StateNotifierProvider<DownloadStateNotifier, DownloadState>(
  (ref) => DownloadStateNotifier(ref.watch(downloadServiceProvider)),
);
