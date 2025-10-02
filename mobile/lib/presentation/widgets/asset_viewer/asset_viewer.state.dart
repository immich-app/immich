import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_controls_provider.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

class ViewerOpenBottomSheetEvent extends Event {
  const ViewerOpenBottomSheetEvent();
}

class ViewerReloadAssetEvent extends Event {
  const ViewerReloadAssetEvent();
}

class AssetViewerState {
  final int backgroundOpacity;
  final bool showingBottomSheet;
  final bool showingControls;
  final BaseAsset? currentAsset;
  final int stackIndex;

  const AssetViewerState({
    this.backgroundOpacity = 255,
    this.showingBottomSheet = false,
    this.showingControls = true,
    this.currentAsset,
    this.stackIndex = 0,
  });

  AssetViewerState copyWith({
    int? backgroundOpacity,
    bool? showingBottomSheet,
    bool? showingControls,
    BaseAsset? currentAsset,
    int? stackIndex,
  }) {
    return AssetViewerState(
      backgroundOpacity: backgroundOpacity ?? this.backgroundOpacity,
      showingBottomSheet: showingBottomSheet ?? this.showingBottomSheet,
      showingControls: showingControls ?? this.showingControls,
      currentAsset: currentAsset ?? this.currentAsset,
      stackIndex: stackIndex ?? this.stackIndex,
    );
  }

  @override
  String toString() {
    return 'AssetViewerState(opacity: $backgroundOpacity, bottomSheet: $showingBottomSheet, controls: $showingControls)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other.runtimeType != runtimeType) return false;
    return other is AssetViewerState &&
        other.backgroundOpacity == backgroundOpacity &&
        other.showingBottomSheet == showingBottomSheet &&
        other.showingControls == showingControls &&
        other.currentAsset == currentAsset &&
        other.stackIndex == stackIndex;
  }

  @override
  int get hashCode =>
      backgroundOpacity.hashCode ^
      showingBottomSheet.hashCode ^
      showingControls.hashCode ^
      currentAsset.hashCode ^
      stackIndex.hashCode;
}

class AssetViewerStateNotifier extends Notifier<AssetViewerState> {
  @override
  AssetViewerState build() {
    return const AssetViewerState();
  }

  void reset() {
    state = const AssetViewerState();
  }

  void setAsset(BaseAsset? asset) {
    if (asset == state.currentAsset) {
      return;
    }
    state = state.copyWith(currentAsset: asset, stackIndex: 0);
  }

  void setOpacity(int opacity) {
    if (opacity == state.backgroundOpacity) {
      return;
    }
    state = state.copyWith(backgroundOpacity: opacity, showingControls: opacity == 255 ? true : state.showingControls);
  }

  void setBottomSheet(bool showing) {
    if (showing == state.showingBottomSheet) {
      return;
    }
    state = state.copyWith(showingBottomSheet: showing, showingControls: showing ? true : state.showingControls);
    if (showing) {
      ref.read(videoPlayerControlsProvider.notifier).pause();
    }
  }

  void setControls(bool isShowing) {
    if (isShowing == state.showingControls) {
      return;
    }
    state = state.copyWith(showingControls: isShowing);
  }

  void toggleControls() {
    state = state.copyWith(showingControls: !state.showingControls);
  }

  void setStackIndex(int index) {
    if (index == state.stackIndex) {
      return;
    }
    state = state.copyWith(stackIndex: index);
  }
}

final assetViewerProvider = NotifierProvider<AssetViewerStateNotifier, AssetViewerState>(AssetViewerStateNotifier.new);
