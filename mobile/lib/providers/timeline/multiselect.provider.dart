import 'package:collection/collection.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';

final multiSelectProvider =
    NotifierProvider<MultiSelectNotifier, MultiSelectState>(
  MultiSelectNotifier.new,
  dependencies: [timelineServiceProvider],
);

class MultiSelectState {
  final Set<BaseAsset> selectedAssets;

  const MultiSelectState({required this.selectedAssets});

  bool get isEnabled => selectedAssets.isNotEmpty;
  bool get hasRemote => selectedAssets.any(
        (asset) =>
            asset.storage == AssetState.remote ||
            asset.storage == AssetState.merged,
      );
  bool get hasLocal => selectedAssets.any(
        (asset) => asset.storage == AssetState.local,
      );

  MultiSelectState copyWith({Set<BaseAsset>? selectedAssets}) {
    return MultiSelectState(
      selectedAssets: selectedAssets ?? this.selectedAssets,
    );
  }

  @override
  String toString() => 'MultiSelectState(selectedAssets: $selectedAssets)';

  @override
  bool operator ==(covariant MultiSelectState other) {
    if (identical(this, other)) return true;
    final listEquals = const DeepCollectionEquality().equals;

    return listEquals(other.selectedAssets, selectedAssets);
  }

  @override
  int get hashCode => selectedAssets.hashCode;
}

class MultiSelectNotifier extends Notifier<MultiSelectState> {
  TimelineService get _timelineService => ref.read(timelineServiceProvider);

  @override
  MultiSelectState build() {
    return const MultiSelectState(selectedAssets: {});
  }

  void selectAsset(BaseAsset asset) {
    if (state.selectedAssets.contains(asset)) {
      return;
    }

    state = state.copyWith(
      selectedAssets: {...state.selectedAssets, asset},
    );
  }

  void deselectAsset(BaseAsset asset) {
    if (!state.selectedAssets.contains(asset)) {
      return;
    }

    state = state.copyWith(
      selectedAssets: state.selectedAssets.where((a) => a != asset).toSet(),
    );
  }

  void toggleAssetSelection(BaseAsset asset) {
    if (state.selectedAssets.contains(asset)) {
      deselectAsset(asset);
    } else {
      selectAsset(asset);
    }
  }

  void reset() {
    state = const MultiSelectState(selectedAssets: {});
  }

  /// Bucket bulk operations
  void selectBucket(int offset, int bucketCount) async {
    final assets = await _timelineService.loadAssets(offset, bucketCount);
    final selectedAssets = state.selectedAssets.toSet();

    selectedAssets.addAll(assets);

    state = state.copyWith(
      selectedAssets: selectedAssets,
    );
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
    final allSelected =
        bucketAssets.every((asset) => state.selectedAssets.contains(asset));

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
}

final bucketSelectionProvider = Provider.family<bool, List<BaseAsset>>(
  (ref, bucketAssets) {
    final selectedAssets =
        ref.watch(multiSelectProvider.select((s) => s.selectedAssets));

    if (bucketAssets.isEmpty) return false;

    // Check if all assets in the bucket are selected
    return bucketAssets.every((asset) => selectedAssets.contains(asset));
  },
  dependencies: [multiSelectProvider, timelineServiceProvider],
);
