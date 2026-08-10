import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';

part 'asset_viewer.provider.freezed.dart';

@freezed
abstract class AssetViewerState with _$AssetViewerState {
  const factory AssetViewerState({
    @Default(1.0) double backgroundOpacity,
    @Default(false) bool showingDetails,
    @Default(true) bool showingControls,
    @Default(false) bool isZoomed,
    @Default(false) bool showingOcr,
    BaseAsset? currentAsset,
    @Default(0) int stackIndex,
  }) = _AssetViewerState;
}

class AssetViewerStateNotifier extends Notifier<AssetViewerState> {
  StreamSubscription<BaseAsset?>? _assetSubscription;

  @override
  AssetViewerState build() {
    ref.onDispose(() => _assetSubscription?.cancel());
    return const AssetViewerState();
  }

  void reset() {
    unawaited(_assetSubscription?.cancel());
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
    unawaited(_assetSubscription?.cancel());
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

    final id = state.currentAsset?.id;
    if (id != null) {
      final notifier = ref.read(videoPlayerProvider(id).notifier);
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
