import 'package:collection/collection.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';

final multiSelectProvider = NotifierProvider<MultiSelectNotifier, MultiSelectState>(
  MultiSelectNotifier.new,
  dependencies: [timelineServiceProvider],
);

class MultiSelectToggleEvent extends Event {
  final bool isEnabled;
  const MultiSelectToggleEvent(this.isEnabled);
}

class MultiSelectState {
  final Set<BaseAsset> selectedAssets;
  final Set<BaseAsset> lockedSelectionAssets;
  final bool forceEnable;

  const MultiSelectState({required this.selectedAssets, required this.lockedSelectionAssets, this.forceEnable = false});

  bool get isEnabled => selectedAssets.isNotEmpty;

  /// Cloud only
  bool get hasRemote =>
      selectedAssets.any((asset) => asset.storage == AssetState.remote || asset.storage == AssetState.merged);

  bool get hasStacked => selectedAssets.any((asset) => asset is RemoteAsset && asset.stackId != null);

  bool get hasLocal => selectedAssets.any((asset) => asset.storage == AssetState.local);

  bool get hasMerged => selectedAssets.any((asset) => asset.storage == AssetState.merged);

  MultiSelectState copyWith({
    Set<BaseAsset>? selectedAssets,
    Set<BaseAsset>? lockedSelectionAssets,
    bool? forceEnable,
  }) {
    return MultiSelectState(
      selectedAssets: selectedAssets ?? this.selectedAssets,
      lockedSelectionAssets: lockedSelectionAssets ?? this.lockedSelectionAssets,
      forceEnable: forceEnable ?? this.forceEnable,
    );
  }

  @override
  String toString() =>
      'MultiSelectState(selectedAssets: $selectedAssets, lockedSelectionAssets: $lockedSelectionAssets, forceEnable: $forceEnable)';

  @override
  bool operator ==(covariant MultiSelectState other) {
    if (identical(this, other)) return true;
    final setEquals = const DeepCollectionEquality().equals;

    return setEquals(other.selectedAssets, selectedAssets) &&
        setEquals(other.lockedSelectionAssets, lockedSelectionAssets) &&
        other.forceEnable == forceEnable;
  }

  @override
  int get hashCode => selectedAssets.hashCode ^ lockedSelectionAssets.hashCode ^ forceEnable.hashCode;
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
  void selectBucket(int offset, int bucketCount) async {
    final assets = await _timelineService.loadAssets(offset, bucketCount);
    final selectedAssets = state.selectedAssets.toSet();

    selectedAssets.addAll(assets);

    state = state.copyWith(selectedAssets: selectedAssets);
  }

  void deselectBucket(int offset, int bucketCount) async {
    final assets = await _timelineService.loadAssets(offset, bucketCount);
    final selectedAssets = state.selectedAssets.toSet();

    selectedAssets.removeAll(assets);

    state = state.copyWith(selectedAssets: selectedAssets);
  }

  void toggleBucketSelection(int offset, int bucketCount) async {
    final assets = await _timelineService.loadAssets(offset, bucketCount);
    toggleBucketSelectionByAssets(assets);
  }

  void toggleBucketSelectionByAssets(List<BaseAsset> bucketAssets) {
    if (bucketAssets.isEmpty) return;

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

  if (bucketAssets.isEmpty) return false;

  // Check if all assets in the bucket are selected
  return bucketAssets.every((asset) => selectedAssets.contains(asset));
}, dependencies: [multiSelectProvider, timelineServiceProvider]);
