import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';

class AssetViewerState {
  final double backgroundOpacity;
  final bool showingDetails;
  final bool showingControls;
  final bool isZoomed;
  final bool showingOcr;
  final BaseAsset? currentAsset;
  final int stackIndex;

  const AssetViewerState({
    this.backgroundOpacity = 1.0,
    this.showingDetails = false,
    this.showingControls = true,
    this.isZoomed = false,
    this.showingOcr = false,
    this.currentAsset,
    this.stackIndex = 0,
  });

  AssetViewerState copyWith({
    double? backgroundOpacity,
    bool? showingDetails,
    bool? showingControls,
    bool? isZoomed,
    bool? showingOcr,
    BaseAsset? currentAsset,
    int? stackIndex,
  }) {
    return AssetViewerState(
      backgroundOpacity: backgroundOpacity ?? this.backgroundOpacity,
      showingDetails: showingDetails ?? this.showingDetails,
      showingControls: showingControls ?? this.showingControls,
      isZoomed: isZoomed ?? this.isZoomed,
      showingOcr: showingOcr ?? this.showingOcr,
      currentAsset: currentAsset ?? this.currentAsset,
      stackIndex: stackIndex ?? this.stackIndex,
    );
  }

  @override
  String toString() {
    return 'AssetViewerState(opacity: $backgroundOpacity, showingDetails: $showingDetails, controls: $showingControls, isZoomed: $isZoomed, showingOcr: $showingOcr)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) {
      return true;
    }
    if (other.runtimeType != runtimeType) {
      return false;
    }
    return other is AssetViewerState &&
        other.backgroundOpacity == backgroundOpacity &&
        other.showingDetails == showingDetails &&
        other.showingControls == showingControls &&
        other.isZoomed == isZoomed &&
        other.showingOcr == showingOcr &&
        other.currentAsset == currentAsset &&
        other.stackIndex == stackIndex;
  }

  @override
  int get hashCode =>
      backgroundOpacity.hashCode ^
      showingDetails.hashCode ^
      showingControls.hashCode ^
      isZoomed.hashCode ^
      showingOcr.hashCode ^
      currentAsset.hashCode ^
      stackIndex.hashCode;
}

class AssetViewerStateNotifier extends Notifier<AssetViewerState> {
  StreamSubscription<BaseAsset?>? _assetSubscription;

  @override
  AssetViewerState build() {
    ref.onDispose(() => _assetSubscription?.cancel());
    return const AssetViewerState();
  }

  void reset() {
    _assetSubscription?.cancel();
    _assetSubscription = null;
    state = const AssetViewerState();
  }

  void setAsset(BaseAsset asset) {
    if (asset == state.currentAsset) {
      return;
    }
    state = state.copyWith(currentAsset: asset, stackIndex: 0, showingOcr: false);
    _watchCurrentAsset(asset);
  }

  void _watchCurrentAsset(BaseAsset asset) {
    _assetSubscription?.cancel();
    _assetSubscription = ref.read(assetServiceProvider).watchAsset(asset).listen((updated) {
      if (updated != null) {
        state = state.copyWith(currentAsset: updated);
      }
    });
  }

  void setOpacity(double opacity) {
    if (opacity == state.backgroundOpacity) {
      return;
    }
    state = state.copyWith(backgroundOpacity: opacity, showingControls: opacity >= 1.0 ? true : state.showingControls);
  }

  void setShowingDetails(bool showing) {
    if (showing == state.showingDetails) {
      return;
    }
    state = state.copyWith(showingDetails: showing, showingControls: showing ? true : state.showingControls);

    final heroTag = state.currentAsset?.heroTag;
    if (heroTag != null) {
      final notifier = ref.read(videoPlayerProvider(heroTag).notifier);
      showing ? notifier.hold() : notifier.release();
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

  void setZoomed(bool isZoomed) {
    if (isZoomed == state.isZoomed) {
      return;
    }
    state = state.copyWith(isZoomed: isZoomed);
  }

  void setStackIndex(int index) {
    if (index == state.stackIndex) {
      return;
    }
    state = state.copyWith(stackIndex: index);
  }

  void toggleOcr() {
    state = state.copyWith(showingOcr: !state.showingOcr);
  }
}

final assetViewerProvider = NotifierProvider<AssetViewerStateNotifier, AssetViewerState>(AssetViewerStateNotifier.new);
