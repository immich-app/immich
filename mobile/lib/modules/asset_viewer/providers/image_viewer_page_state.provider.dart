import 'package:easy_localization/easy_localization.dart';
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

  void shareAsset(AssetResponseDto asset, BuildContext context) async {
    showDialog(
      context: context,
      builder: (BuildContext buildContext) {
        _imageViewerService
            .shareAsset(asset)
            .then((_) => Navigator.pop(buildContext));
        return AlertDialog(
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const CircularProgressIndicator(),
              Container(
                margin: const EdgeInsets.only(top: 12),
                child: const Text('image_viewer_state_notifier_share_preparing')
                    .tr(),
              )
            ],
          ),
        );
      },
      barrierDismissible: false,
    );
  }
}

final imageViewerStateProvider =
    StateNotifierProvider<ImageViewerStateNotifier, ImageViewerPageState>(
  ((ref) => ImageViewerStateNotifier(ref.watch(imageViewerServiceProvider))),
);
