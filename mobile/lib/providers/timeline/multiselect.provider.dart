import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';

final multiSelectProvider = NotifierProvider<MultiSelectNotifier, MultiSelectState>(
  MultiSelectNotifier.new,
  dependencies: [timelineServiceProvider],
);

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
    return _assetSetsEqual(other.selectedAssets, selectedAssets) &&
        _assetSetsEqual(other.lockedSelectionAssets, lockedSelectionAssets) &&
        other.forceEnable == forceEnable;
  }

  @override
  int get hashCode =>
      Object.hashAllUnordered(selectedAssets.map(_assetEqualityHash)) ^
      Object.hashAllUnordered(lockedSelectionAssets.map(_assetEqualityHash)) ^
      forceEnable.hashCode;

  static int _baseAssetEqualityHash(BaseAsset asset) {
    return Object.hash(
      asset.name,
      asset.type,
      asset.createdAt,
      asset.updatedAt,
      asset.width,
      asset.height,
      asset.durationMs,
      asset.isFavorite,
      asset.isEdited,
    );
  }

  static bool _assetSetsEqual(Set<BaseAsset> left, Set<BaseAsset> right) {
    return left.length == right.length && left.every((asset) => MultiSelectNotifier.containsAsset(right, asset));
  }

  static int _assetEqualityHash(BaseAsset asset) {
    return switch (asset) {
      RemoteAsset() => Object.hash(
        _baseAssetEqualityHash(asset),
        asset.id,
        asset.ownerId,
        asset.thumbHash,
        asset.visibility,
        asset.stackId,
        asset.uploadedAt,
        asset.deletedAt,
      ),
      LocalAsset() => Object.hash(
        _baseAssetEqualityHash(asset),
        asset.id,
        asset.cloudId,
        asset.orientation,
        asset.playbackStyle,
        asset.adjustmentTime,
        asset.latitude,
        asset.longitude,
      ),
    };
  }
}

class MultiSelectNotifier extends Notifier<MultiSelectState> {
  MultiSelectNotifier([this._defaultState]);
  final MultiSelectState? _defaultState;

  TimelineService get _timelineService => ref.read(timelineServiceProvider);

  @override
  MultiSelectState build() {
    return _defaultState ?? const MultiSelectState(selectedAssets: {}, lockedSelectionAssets: {}, forceEnable: false);
  }

  static bool containsAsset(Iterable<BaseAsset> assets, BaseAsset? asset) {
    return asset != null && assets.any((a) => a == asset);
  }

  static Set<BaseAsset> addAssets(Set<BaseAsset> selectedAssets, Iterable<BaseAsset> assets) {
    final next = selectedAssets.toSet();
    for (final asset in assets) {
      if (!containsAsset(next, asset)) {
        next.add(asset);
      }
    }
    return next;
  }

  static Set<BaseAsset> removeAssets(Set<BaseAsset> selectedAssets, Iterable<BaseAsset> assets) {
    return selectedAssets.where((selected) => !assets.any((asset) => asset == selected)).toSet();
  }

  void selectAsset(BaseAsset asset) {
    if (containsAsset(state.selectedAssets, asset)) {
      return;
    }

    state = state.copyWith(selectedAssets: {...state.selectedAssets, asset});
  }

  void deselectAsset(BaseAsset asset) {
    if (!containsAsset(state.selectedAssets, asset)) {
      return;
    }

    state = state.copyWith(selectedAssets: state.selectedAssets.where((a) => a != asset).toSet());
  }

  void toggleAssetSelection(BaseAsset asset) {
    if (containsAsset(state.selectedAssets, asset)) {
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
    state = state.copyWith(selectedAssets: addAssets(state.selectedAssets, assets));
  }

  void deselectBucket(int offset, int bucketCount) async {
    final assets = await _timelineService.loadAssets(offset, bucketCount);
    state = state.copyWith(selectedAssets: removeAssets(state.selectedAssets, assets));
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
    final allSelected = bucketAssets.every((asset) => containsAsset(state.selectedAssets, asset));

    if (allSelected) {
      state = state.copyWith(selectedAssets: removeAssets(state.selectedAssets, bucketAssets));
    } else {
      state = state.copyWith(selectedAssets: addAssets(state.selectedAssets, bucketAssets));
    }
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
  return bucketAssets.every((asset) => MultiSelectNotifier.containsAsset(selectedAssets, asset));
}, dependencies: [multiSelectProvider, timelineServiceProvider]);
