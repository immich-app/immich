import 'package:background_downloader/background_downloader.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/services/album.service.dart';
import 'package:immich_mobile/models/asset_viewer/asset_viewer_page_state.model.dart';
import 'package:immich_mobile/services/image_viewer.service.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/services/share.service.dart';
import 'package:immich_mobile/utils/download.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:immich_mobile/widgets/common/share_dialog.dart';

class ImageViewerStateNotifier extends StateNotifier<AssetViewerPageState> {
  final ImageViewerService _imageViewerService;
  final ShareService _shareService;
  final AlbumService _albumService;

  ImageViewerStateNotifier(
    this._imageViewerService,
    this._shareService,
    this._albumService,
  ) : super(
          AssetViewerPageState(
            downloadStatus: TaskStatus.complete,
            showProgress: false,
            downloadProgress: null,
          ),
        ) {
    FileDownloader().registerCallbacks(
      group: downloadGroupImage,
      taskStatusCallback: _downloadImageCallback,
      taskProgressCallback: _taskProgressCallback,
    );

    FileDownloader().registerCallbacks(
      group: downloadGroupVideo,
      taskStatusCallback: _downloadVideoCallback,
      taskProgressCallback: _taskProgressCallback,
    );

    FileDownloader().registerCallbacks(
      group: downloadGroupLivePhoto,
      taskStatusCallback: _downloadLivePhotoCallback,
      taskProgressCallback: _taskProgressCallback,
    );
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
        _onDownloadComplete();
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
        _onDownloadComplete();
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
        _onDownloadComplete();
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
      downloadProgress: update,
      showProgress: true,
    );
  }

  void _onDownloadComplete() {
    Future.delayed(const Duration(seconds: 1), () {
      state = state.copyWith(
        showProgress: false,
      );
    });
  }

  void downloadAsset(Asset asset, BuildContext context) async {
    await _imageViewerService.downloadAsset(asset);
    // await _albumService.refreshDeviceAlbums();
  }

  void cancelDownload(String id) async {
    final isCanceled = await FileDownloader().cancelTaskWithId(id);

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

final imageViewerStateProvider =
    StateNotifierProvider<ImageViewerStateNotifier, AssetViewerPageState>(
  ((ref) => ImageViewerStateNotifier(
        ref.watch(imageViewerServiceProvider),
        ref.watch(shareServiceProvider),
        ref.watch(albumServiceProvider),
      )),
);
