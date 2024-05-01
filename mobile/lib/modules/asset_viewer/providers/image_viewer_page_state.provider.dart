import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/album/services/album.service.dart';
import 'package:immich_mobile/models/asset_viewer/asset_viewer_page_state.model.dart';
import 'package:immich_mobile/modules/asset_viewer/services/image_viewer.service.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/shared/services/share.service.dart';
import 'package:immich_mobile/shared/ui/immich_toast.dart';
import 'package:immich_mobile/shared/ui/share_dialog.dart';

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
            downloadAssetStatus: DownloadAssetStatus.idle,
          ),
        );

  void downloadAsset(Asset asset, BuildContext context) async {
    state = state.copyWith(downloadAssetStatus: DownloadAssetStatus.loading);

    ImmichToast.show(
      context: context,
      msg: 'image_viewer_page_state_provider_download_started'.tr(),
      toastType: ToastType.info,
      gravity: ToastGravity.BOTTOM,
    );

    bool isSuccess = await _imageViewerService.downloadAssetToDevice(asset);

    if (isSuccess) {
      state = state.copyWith(downloadAssetStatus: DownloadAssetStatus.success);

      ImmichToast.show(
        context: context,
        msg: 'image_viewer_page_state_provider_download_success'.tr(),
        toastType: ToastType.success,
        gravity: ToastGravity.BOTTOM,
      );
      _albumService.refreshDeviceAlbums();
    } else {
      state = state.copyWith(downloadAssetStatus: DownloadAssetStatus.error);
      ImmichToast.show(
        context: context,
        msg: 'image_viewer_page_state_provider_download_error'.tr(),
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
        _shareService.shareAsset(asset).then(
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
