import 'package:background_downloader/background_downloader.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/models/download/download_state.model.dart';
import 'package:immich_mobile/models/download/livephotos_medatada.model.dart';
import 'package:immich_mobile/services/download.service.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/services/share.service.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:immich_mobile/widgets/common/share_dialog.dart';

class DownloadStateNotifier extends StateNotifier<DownloadState> {
  final DownloadService _downloadService;
  final ShareService _shareService;

  DownloadStateNotifier(
    this._downloadService,
    this._shareService,
  ) : super(
          DownloadState(
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

  // Download live photo callback
  void _downloadLivePhotoCallback(TaskStatusUpdate update) {
    _updateDownloadStatus(update.task.taskId, update.status);

    switch (update.status) {
      case TaskStatus.complete:
        if (update.task.metaData.isEmpty) {
          return;
        }
        final livePhotosId =
            LivePhotosMetadata.fromJson(update.task.metaData).id;
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
        _downloadService.saveImage(update.task);
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
    // Ignore if the task is cancled or completed
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
      state = state.copyWith(
        taskProgress: <String, DownloadInfo>{}
          ..addAll(state.taskProgress)
          ..remove(id),
      );

      if (state.taskProgress.isEmpty) {
        state = state.copyWith(
          showProgress: false,
        );
      }
    });
  }

  void downloadAsset(Asset asset, BuildContext context) async {
    await _downloadService.download(asset);
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
      state = state.copyWith(
        showProgress: false,
      );
    }
  }

  void shareAsset(Asset asset, BuildContext context) async {
    showDialog(
      context: context,
      builder: (BuildContext buildContext) {
        _shareService.shareAsset(asset, context).then(
          (bool status) {
            if (!status) {
              ImmichToast.show(
                context: context,
                msg: 'image_viewer_page_state_provider_share_error'.tr(),
                toastType: ToastType.error,
                gravity: ToastGravity.BOTTOM,
              );
            }
            buildContext.pop();
          },
        );
        return const ShareDialog();
      },
      barrierDismissible: false,
    );
  }
}

final downloadStateProvider =
    StateNotifierProvider<DownloadStateNotifier, DownloadState>(
  ((ref) => DownloadStateNotifier(
        ref.watch(downloadServiceProvider),
        ref.watch(shareServiceProvider),
      )),
);
