import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/asset_viewer/models/image_viewer_page_state.model.dart';
import 'package:immich_mobile/modules/asset_viewer/services/image_viewer.service.dart';
import 'package:immich_mobile/shared/ui/immich_toast.dart';
import 'package:openapi/api.dart';

class ImageViewerStateNotifier extends StateNotifier<ImageViewerPageState> {
  final ImageViewerService _imageViewerService;

  ImageViewerStateNotifier(this._imageViewerService)
      : super(
          ImageViewerPageState(
            downloadAssetStatus: DownloadAssetStatus.idle,
          ),
        );

  void downloadAsset(AssetResponseDto asset, BuildContext context) async {
    state = state.copyWith(downloadAssetStatus: DownloadAssetStatus.loading);

    bool isSuccess = await _imageViewerService.downloadAssetToDevice(asset);

    if (isSuccess) {
      state = state.copyWith(downloadAssetStatus: DownloadAssetStatus.success);

      ImmichToast.show(
        context: context,
        msg: "Download Success",
        toastType: ToastType.success,
        gravity: ToastGravity.BOTTOM,
      );
    } else {
      state = state.copyWith(downloadAssetStatus: DownloadAssetStatus.error);
      ImmichToast.show(
        context: context,
        msg: "Download Error",
        toastType: ToastType.error,
        gravity: ToastGravity.BOTTOM,
      );
    }

    state = state.copyWith(downloadAssetStatus: DownloadAssetStatus.idle);
  }
}

final imageViewerStateProvider =
    StateNotifierProvider<ImageViewerStateNotifier, ImageViewerPageState>(
  ((ref) => ImageViewerStateNotifier(ref.watch(imageViewerServiceProvider))),
);
