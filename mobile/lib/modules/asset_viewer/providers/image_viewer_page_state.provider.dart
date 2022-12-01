import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/asset_viewer/models/image_viewer_page_state.model.dart';
import 'package:immich_mobile/modules/asset_viewer/services/image_viewer.service.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/services/share.service.dart';
import 'package:immich_mobile/shared/ui/immich_toast.dart';
import 'package:immich_mobile/shared/ui/share_dialog.dart';
import 'package:openapi/api.dart';

class ImageViewerStateNotifier extends StateNotifier<ImageViewerPageState> {
  final ImageViewerService _imageViewerService;
  final ShareService _shareService;

  ImageViewerStateNotifier(this._imageViewerService, this._shareService)
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

  void shareAsset(Asset asset, BuildContext context) async {
    showDialog(
      context: context,
      builder: (BuildContext buildContext) {
        _shareService
            .shareAsset(asset)
            .then((_) => Navigator.of(buildContext).pop());
        return const ShareDialog();
      },
      barrierDismissible: false,
    );
  }
}

final imageViewerStateProvider =
    StateNotifierProvider<ImageViewerStateNotifier, ImageViewerPageState>(
  ((ref) => ImageViewerStateNotifier(
        ref.watch(imageViewerServiceProvider),
        ref.watch(shareServiceProvider),
      )),
);
