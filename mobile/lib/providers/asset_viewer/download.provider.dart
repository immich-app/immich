import 'package:background_downloader/background_downloader.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/services/album.service.dart';
import 'package:immich_mobile/models/asset_viewer/download_state.model..dart';
import 'package:immich_mobile/services/download.service.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/services/share.service.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:immich_mobile/widgets/common/share_dialog.dart';

class DownloadStateNotifier extends StateNotifier<DownloadState> {
  final DownloadService _imageViewerService;
  final ShareService _shareService;
  final AlbumService _albumService;

  DownloadStateNotifier(
    this._imageViewerService,
    this._shareService,
    this._albumService,
  ) : super(
          DownloadState(
            downloadStatus: TaskStatus.complete,
            showProgress: false,
            taskProgress: <String, DownloadProgress>{},
          ),
        ) {
    _imageViewerService.onImageDownloadStatus = _downloadImageCallback;
    _imageViewerService.onVideoDownloadStatus = _downloadVideoCallback;
    _imageViewerService.onLivePhotoDownloadStatus = _downloadLivePhotoCallback;
    _imageViewerService.onTaskProgress = _taskProgressCallback;
  }

  void _updateDownloadStatus(TaskStatus status) {
    state = state.copyWith(downloadStatus: status);
  }

  // Download live photo callback
  void _downloadLivePhotoCallback(TaskStatusUpdate update) {
    _updateDownloadStatus(update.status);

    switch (update.status) {
      case TaskStatus.complete:
        _imageViewerService.saveLivePhoto(update.task);
        _onDownloadComplete(update.task.taskId);
        break;

      case TaskStatus.failed:
        print("task failed");
        break;

      case TaskStatus.running:
        print("running");

      default:
        break;
    }
  }

  // Download image callback
  void _downloadImageCallback(TaskStatusUpdate update) {
    _updateDownloadStatus(update.status);

    switch (update.status) {
      case TaskStatus.complete:
        _imageViewerService.saveImage(update.task);
        _onDownloadComplete(update.task.taskId);
        break;

      case TaskStatus.failed:
        print("task failed");
        break;

      case TaskStatus.running:
        print("running");

      default:
        break;
    }
  }

  // Download video callback
  void _downloadVideoCallback(TaskStatusUpdate update) {
    _updateDownloadStatus(update.status);

    switch (update.status) {
      case TaskStatus.complete:
        _imageViewerService.saveVideo(update.task);
        _onDownloadComplete(update.task.taskId);
        break;

      case TaskStatus.failed:
        print("task failed");
        break;

      case TaskStatus.running:
        print("running");

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
      taskProgress: <String, DownloadProgress>{}
        ..addAll(state.taskProgress)
        ..addAll({
          update.task.taskId: DownloadProgress(
            progress: update.progress,
          ),
        }),
    );

    print("task progress: ${state.taskProgress}");
  }

  void _onDownloadComplete(String id) {
    Future.delayed(const Duration(seconds: 1), () {
      state = state.copyWith(
        showProgress: false,
        taskProgress: <String, DownloadProgress>{}
          ..addAll(state.taskProgress)
          ..remove(id),
      );
    });
  }

  void downloadAsset(Asset asset, BuildContext context) async {
    await _imageViewerService.download(asset);
    // await _albumService.refreshDeviceAlbums();
  }

  void cancelDownload(String id) async {
    final isCanceled = await _imageViewerService.cancelDownload(id);

    if (isCanceled) {
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
        ref.watch(albumServiceProvider),
      )),
);
