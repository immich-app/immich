// ignore_for_file: use-ref-and-state-synchronously

import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';

part 'multiselect.provider.freezed.dart';

final multiSelectProvider = NotifierProvider<MultiSelectNotifier, MultiSelectState>(
  MultiSelectNotifier.new,
  dependencies: [timelineServiceProvider],
);

@freezed
abstract class MultiSelectState with _$MultiSelectState {
  const MultiSelectState._();

  const factory MultiSelectState({
    required Set<BaseAsset> selectedAssets,
    required Set<BaseAsset> lockedSelectionAssets,
    @Default(false) bool forceEnable,
  }) = _MultiSelectState;

  bool get isEnabled => selectedAssets.isNotEmpty;

  /// Cloud only
  bool get hasRemote =>
      selectedAssets.any((asset) => asset.storage == AssetState.remote || asset.storage == AssetState.merged);

  bool get hasMerged => selectedAssets.any((asset) => asset.storage == AssetState.merged);

  bool get onlyLocal => selectedAssets.any((asset) => asset.storage == AssetState.local);

  bool get onlyRemote => selectedAssets.any((asset) => asset.storage == AssetState.remote);
}

class MultiSelectNotifier extends Notifier<MultiSelectState> {
  MultiSelectNotifier([this._defaultState]);
  final MultiSelectState? _defaultState;

  TimelineService get _timelineService => ref.read(timelineServiceProvider);

  @override
  MultiSelectState build() {
    return _defaultState ?? const MultiSelectState(selectedAssets: {}, lockedSelectionAssets: {}, forceEnable: false);
  }

  void selectAsset(BaseAsset asset) {
    if (state.selectedAssets.contains(asset)) {
      return;
    }

    state = state.copyWith(selectedAssets: {...state.selectedAssets, asset});
  }

  void deselectAsset(BaseAsset asset) {
    if (!state.selectedAssets.contains(asset)) {
      return;
    }

    state = state.copyWith(selectedAssets: state.selectedAssets.where((a) => a != asset).toSet());
  }

  void toggleAssetSelection(BaseAsset asset) {
    if (state.selectedAssets.contains(asset)) {
      deselectAsset(asset);
    } else {
      selectAsset(asset);
    }
  }

  void reset() {
    state = const MultiSelectState(selectedAssets: {}, lockedSelectionAssets: {}, forceEnable: false);
  }

  /// Bucket bulk operations
  Future<void> selectBucket(int offset, int bucketCount) async {
    final assets = await _timelineService.loadAssets(offset, bucketCount);
    final selectedAssets = state.selectedAssets.toSet();

    selectedAssets.addAll(assets);

    state = state.copyWith(selectedAssets: selectedAssets);
  }

  Future<void> deselectBucket(int offset, int bucketCount) async {
    final assets = await _timelineService.loadAssets(offset, bucketCount);
    final selectedAssets = state.selectedAssets.toSet();

    selectedAssets.removeAll(assets);

    state = state.copyWith(selectedAssets: selectedAssets);
  }

  Future<void> toggleBucketSelection(int offset, int bucketCount) async {
    final assets = await _timelineService.loadAssets(offset, bucketCount);
    toggleBucketSelectionByAssets(assets);
  }

  void toggleBucketSelectionByAssets(List<BaseAsset> bucketAssets) {
    if (bucketAssets.isEmpty) {
      return;
    }

    // Check if all assets in this bucket are currently selected
    final allSelected = bucketAssets.every((asset) => state.selectedAssets.contains(asset));

    final selectedAssets = state.selectedAssets.toSet();

    if (allSelected) {
      // If all assets in this bucket are selected, deselect them
      selectedAssets.removeAll(bucketAssets);
    } else {
      // If not all assets in this bucket are selected, select them all
      selectedAssets.addAll(bucketAssets);
    }

    state = state.copyWith(selectedAssets: selectedAssets);
  }

  void setLockedSelectionAssets(Set<BaseAsset> assets) {
    state = state.copyWith(lockedSelectionAssets: assets);
  }
}

final bucketSelectionProvider = Provider.family<bool, List<BaseAsset>>((ref, bucketAssets) {
  final selectedAssets = ref.watch(multiSelectProvider.select((s) => s.selectedAssets));

  if (bucketAssets.isEmpty) {
    return false;
  }

  // Check if all assets in the bucket are selected
  return bucketAssets.every((asset) => selectedAssets.contains(asset));
}, dependencies: [multiSelectProvider, timelineServiceProvider]);
