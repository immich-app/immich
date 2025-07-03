import 'package:riverpod_annotation/riverpod_annotation.dart';

class AssetViewerState {
  final int backgroundOpacity;
  final bool showingBottomSheet;

  const AssetViewerState({
    this.backgroundOpacity = 255,
    this.showingBottomSheet = false,
  });

  AssetViewerState copyWith({
    int? backgroundOpacity,
    bool? showingBottomSheet,
  }) {
    return AssetViewerState(
      backgroundOpacity: backgroundOpacity ?? this.backgroundOpacity,
      showingBottomSheet: showingBottomSheet ?? this.showingBottomSheet,
    );
  }

  @override
  String toString() {
    return 'AssetViewerState(backgroundOpacity: $backgroundOpacity, showingBottomSheet: $showingBottomSheet)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other.runtimeType != runtimeType) return false;
    return other is AssetViewerState &&
        other.backgroundOpacity == backgroundOpacity &&
        other.showingBottomSheet == showingBottomSheet;
  }

  @override
  int get hashCode => backgroundOpacity.hashCode ^ showingBottomSheet.hashCode;
}

class AssetViewerStateNotifier extends AutoDisposeNotifier<AssetViewerState> {
  @override
  AssetViewerState build() {
    return const AssetViewerState();
  }

  void setOpacity(int opacity) {
    state = state.copyWith(backgroundOpacity: opacity);
  }

  void setBottomSheet(bool showing) {
    state = state.copyWith(showingBottomSheet: showing);
  }
}

final assetViewerProvider =
    AutoDisposeNotifierProvider<AssetViewerStateNotifier, AssetViewerState>(
  AssetViewerStateNotifier.new,
);
