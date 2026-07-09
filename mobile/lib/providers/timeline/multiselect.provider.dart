import 'package:collection/collection.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';

final multiSelectProvider = NotifierProvider<MultiSelectNotifier, MultiSelectState>(
  MultiSelectNotifier.new,
  dependencies: [timelineServiceProvider],
);

bool refersToSelectedAsset(Iterable<BaseAsset> assets, BaseAsset asset) {
  return assets.any((selected) => selected == asset || selected.refersToSameAsset(asset));
}

Set<BaseAsset> removeReferringAsset(Iterable<BaseAsset> assets, BaseAsset asset) {
  return assets.where((selected) => !(selected == asset || selected.refersToSameAsset(asset))).toSet();
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

  bool get hasMerged => selectedAssets.any((asset) => asset.storage == AssetState.merged);

  bool get onlyLocal => selectedAssets.any((asset) => asset.storage == AssetState.local);

  bool get onlyRemote => selectedAssets.any((asset) => asset.storage == AssetState.remote);

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
    if (identical(this, other)) {
      return true;
    }
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
    if (refersToSelectedAsset(state.selectedAssets, asset)) {
      return;
    }

    state = state.copyWith(selectedAssets: {...state.selectedAssets, asset});
  }

  void deselectAsset(BaseAsset asset) {
    if (!refersToSelectedAsset(state.selectedAssets, asset)) {
      return;
    }

    state = state.copyWith(selectedAssets: removeReferringAsset(state.selectedAssets, asset));
  }

  void toggleAssetSelection(BaseAsset asset) {
    if (refersToSelectedAsset(state.selectedAssets, asset)) {
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

    for (final asset in assets) {
      if (!refersToSelectedAsset(selectedAssets, asset)) {
        selectedAssets.add(asset);
      }
    }

    state = state.copyWith(selectedAssets: selectedAssets);
  }

  void deselectBucket(int offset, int bucketCount) async {
    final assets = await _timelineService.loadAssets(offset, bucketCount);
    var selectedAssets = state.selectedAssets.toSet();
    for (final asset in assets) {
      selectedAssets = removeReferringAsset(selectedAssets, asset);
    }

    state = state.copyWith(selectedAssets: selectedAssets);
  }

  void toggleBucketSelection(int offset, int bucketCount) async {
    final assets = await _timelineService.loadAssets(offset, bucketCount);
    toggleBucketSelectionByAssets(assets);
  }

  void toggleBucketSelectionByAssets(List<BaseAsset> bucketAssets) {
    if (bucketAssets.isEmpty) {
      return;
    }

    // Check if all assets in this bucket are currently selected
    final allSelected = bucketAssets.every((asset) => refersToSelectedAsset(state.selectedAssets, asset));

    final selectedAssets = state.selectedAssets.toSet();

    if (allSelected) {
      // If all assets in this bucket are selected, deselect them
      var nextSelectedAssets = selectedAssets;
      for (final asset in bucketAssets) {
        nextSelectedAssets = removeReferringAsset(nextSelectedAssets, asset);
      }
      state = state.copyWith(selectedAssets: nextSelectedAssets);
      return;
    } else {
      // If not all assets in this bucket are selected, select them all
      for (final asset in bucketAssets) {
        if (!refersToSelectedAsset(selectedAssets, asset)) {
          selectedAssets.add(asset);
        }
      }
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
  return bucketAssets.every((asset) => refersToSelectedAsset(selectedAssets, asset));
}, dependencies: [multiSelectProvider, timelineServiceProvider]);
