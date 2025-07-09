import 'package:immich_mobile/providers/asset_viewer/video_player_controls_provider.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

class AssetViewerState {
  final int backgroundOpacity;
  final bool showingBottomSheet;
  final bool showingControls;

  const AssetViewerState({
    this.backgroundOpacity = 255,
    this.showingBottomSheet = false,
    this.showingControls = true,
  });

  AssetViewerState copyWith({
    int? backgroundOpacity,
    bool? showingBottomSheet,
    bool? showingControls,
  }) {
    return AssetViewerState(
      backgroundOpacity: backgroundOpacity ?? this.backgroundOpacity,
      showingBottomSheet: showingBottomSheet ?? this.showingBottomSheet,
      showingControls: showingControls ?? this.showingControls,
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
        other.showingControls == showingControls;
  }

  @override
  int get hashCode =>
      backgroundOpacity.hashCode ^
      showingBottomSheet.hashCode ^
      showingControls.hashCode;
}

class AssetViewerStateNotifier extends AutoDisposeNotifier<AssetViewerState> {
  @override
  AssetViewerState build() {
    return const AssetViewerState();
  }

  void setOpacity(int opacity) {
    state = state.copyWith(
      backgroundOpacity: opacity,
      showingControls: opacity == 255 ? true : state.showingControls,
    );
  }

  void setBottomSheet(bool showing) {
    state = state.copyWith(
      showingBottomSheet: showing,
      showingControls: showing ? true : state.showingControls,
    );
    if (showing) {
      ref.read(videoPlayerControlsProvider.notifier).pause();
    }
  }

  void setControls(bool isShowing) {
    state = state.copyWith(showingControls: isShowing);
  }

  void toggleControls() {
    state = state.copyWith(showingControls: !state.showingControls);
  }
}

final assetViewerProvider =
    AutoDisposeNotifierProvider<AssetViewerStateNotifier, AssetViewerState>(
  AssetViewerStateNotifier.new,
);
