import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/asset_viewer/models/image_viewer_page_state.model.dart';
import 'package:immich_mobile/modules/asset_viewer/models/request_download_asset_info.model.dart';
import 'package:immich_mobile/modules/asset_viewer/services/image_viewer.service.dart';

class ImageViewerStateNotifier extends StateNotifier<ImageViewerPageState> {
  ImageViewerStateNotifier() : super(ImageViewerPageState(isBottomSheetEnable: false));

  void toggleBottomSheet() {
    bool isBottomSheetEnable = state.isBottomSheetEnable;

    if (isBottomSheetEnable) {
      state.copyWith(isBottomSheetEnable: false);
    } else {
      state.copyWith(isBottomSheetEnable: true);
    }
  }
}

final imageViewerStateProvider =
    StateNotifierProvider<ImageViewerStateNotifier, ImageViewerPageState>(((ref) => ImageViewerStateNotifier()));

final downloadAssetProvider = FutureProvider.autoDispose.family<String, RequestDownloadAssetInfo>((ref, req) async {
  final ImageViewerService imageViewerService = ImageViewerService();

  print("Running download asset provider");
  imageViewerService.downloadAssetToDevice(req.assetId, req.deviceId);

  return "ok";
});
