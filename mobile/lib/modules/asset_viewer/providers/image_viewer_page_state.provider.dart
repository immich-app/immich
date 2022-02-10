import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/asset_viewer/models/image_viewer_page_state.model.dart';
import 'package:immich_mobile/modules/home/models/home_page_state.model.dart';
import 'package:immich_mobile/shared/models/immich_asset.model.dart';

class ImageViewerPageStateNotifier extends StateNotifier<ImageViewerPageState> {
  ImageViewerPageStateNotifier() : super(ImageViewerPageState(isBottomSheetEnable: false));

  void toggleBottomSheet() {
    bool isBottomSheetEnable = state.isBottomSheetEnable;

    if (isBottomSheetEnable) {
      state.copyWith(isBottomSheetEnable: false);
    } else {
      state.copyWith(isBottomSheetEnable: true);
    }
  }
}

final homePageStateProvider = StateNotifierProvider<ImageViewerPageStateNotifier, ImageViewerPageState>(
    ((ref) => ImageViewerPageStateNotifier()));
