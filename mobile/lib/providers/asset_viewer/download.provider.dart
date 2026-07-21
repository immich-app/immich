import 'dart:async';

import 'package:background_downloader/background_downloader.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/download/download_state.model.dart';
import 'package:immich_mobile/models/download/livephotos_medatada.model.dart';
import 'package:immich_mobile/services/download.service.dart';

class DownloadStateNotifier extends StateNotifier<DownloadState> {
  final DownloadService _downloadService;

  // Tasks that already finished. background_downloader can deliver a progress
  // update after the task completed (and was removed from state); without this
  // we'd re-add it as running and the progress bar would never go away.
  final Set<String> _finishedTaskIds = {};

  DownloadStateNotifier(this._downloadService)
    : super(
        const DownloadState(
          downloadStatus: TaskStatus.complete,
          showProgress: false,
          taskProgress: <String, DownloadInfo>{},
        ),
      ) {
    _downloadService.onImageDownloadStatus = _downloadImageCallback;
    _downloadService.onVideoDownloadStatus = _downloadVideoCallback;
    _downloadService.onLivePhotoDownloadStatus = _downloadLivePhotoCallback;
    _downloadService.onTaskProgress = _taskProgressCallback;
  }

  void _updateDownloadStatus(String taskId, TaskStatus status) {
    if (status == TaskStatus.canceled) {
      return;
    }

    if (status != TaskStatus.complete) {
      // A fresh attempt for this task (e.g. re-download), clear any finished mark.
      _finishedTaskIds.remove(taskId);
    }

    state = state.copyWith(
      taskProgress: <String, DownloadInfo>{}
        ..addAll(state.taskProgress)
        ..addAll({
          taskId: DownloadInfo(
            progress: status == TaskStatus.complete ? 1.0 : (state.taskProgress[taskId]?.progress ?? 0),
            fileName: state.taskProgress[taskId]?.fileName ?? '',
            status: status,
          ),
        }),
    );
  }

  // Download live photo callback
  void _downloadLivePhotoCallback(TaskStatusUpdate update) {
    _updateDownloadStatus(update.task.taskId, update.status);

    switch (update.status) {
      case TaskStatus.complete:
        if (update.task.metaData.isEmpty) {
          return;
        }
        final livePhotosId = LivePhotosMetadata.fromJson(update.task.metaData).id;
        _downloadService.saveLivePhotos(update.task, livePhotosId);
        _onDownloadComplete(update.task.taskId);
        break;

      default:
        break;
    }
  }

  // Download image callback
  void _downloadImageCallback(TaskStatusUpdate update) {
    _updateDownloadStatus(update.task.taskId, update.status);

    switch (update.status) {
      case TaskStatus.complete:
        _downloadService.saveImageWithPath(update.task);
        _onDownloadComplete(update.task.taskId);
        break;

      default:
        break;
    }
  }

  // Download video callback
  void _downloadVideoCallback(TaskStatusUpdate update) {
    _updateDownloadStatus(update.task.taskId, update.status);

    switch (update.status) {
      case TaskStatus.complete:
        _downloadService.saveVideo(update.task);
        _onDownloadComplete(update.task.taskId);
        break;

      default:
        break;
    }
  }

  void _taskProgressCallback(TaskProgressUpdate update) {
    // Ignore if the task is canceled or completed
    if (update.progress == -2 || update.progress == -1) {
      return;
    }

    // Ignore a late progress update for a task that already finished, otherwise it
    // gets re-added as running and the progress bar never goes away.
    if (_finishedTaskIds.contains(update.task.taskId)) {
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

    // Some downloads only ever deliver progress and never a terminal status
    // callback. Once we hit 100%, schedule the cleanup ourselves so the bar
    // can't stay stuck on a task that already finished.
    if (update.progress >= 1.0) {
      _onDownloadComplete(update.task.taskId);
    }
  }

  void _onDownloadComplete(String id) {
    _finishedTaskIds.add(id);
    Future.delayed(const Duration(seconds: 2), () {
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

  void cancelDownload(String id) async {
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
  ((ref) => DownloadStateNotifier(ref.watch(downloadServiceProvider))),
);
