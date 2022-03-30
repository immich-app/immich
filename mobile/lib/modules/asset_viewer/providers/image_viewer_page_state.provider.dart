import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/asset_viewer/models/image_viewer_page_state.model.dart';
import 'package:immich_mobile/modules/asset_viewer/services/image_viewer.service.dart';
import 'package:immich_mobile/shared/models/immich_asset.model.dart';

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

final downloadAssetProvider = FutureProvider.autoDispose.family<String, ImmichAsset>((ref, asset) async {
  final ImageViewerService imageViewerService = ImageViewerService();

  imageViewerService.downloadAssetToDevice(asset);

  return "ok";
});
