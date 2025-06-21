import 'package:collection/collection.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';

final multiSelectProvider =
    StateNotifierProvider<MultiSelectProviderNotifier, MultiSelectState>(
  (ref) => MultiSelectProviderNotifier(ref.watch(timelineServiceProvider)),
  dependencies: [timelineServiceProvider],
);

class MultiSelectState {
  final List<BaseAsset> selectedAssets;

  MultiSelectState({
    required this.selectedAssets,
  });

  bool get isEnabled => selectedAssets.isNotEmpty;

  MultiSelectState copyWith({
    List<BaseAsset>? selectedAssets,
  }) {
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

class MultiSelectProviderNotifier extends StateNotifier<MultiSelectState> {
  MultiSelectProviderNotifier(this._timelineService)
      : super(
          MultiSelectState(selectedAssets: []),
        );

  final TimelineService _timelineService;

  void selectAsset(BaseAsset asset) {
    if (state.selectedAssets.contains(asset)) {
      return;
    }

    state = state.copyWith(
      selectedAssets: [...state.selectedAssets, asset],
    );
  }

  void deselectAsset(BaseAsset asset) {
    if (!state.selectedAssets.contains(asset)) {
      return;
    }

    state = state.copyWith(
      selectedAssets: state.selectedAssets.where((a) => a != asset).toList(),
    );
  }

  void toggleAssetSelection(BaseAsset asset) {
    if (state.selectedAssets.contains(asset)) {
      deselectAsset(asset);
    } else {
      selectAsset(asset);
    }
  }

  /// Bucket

  void selectBucket(int offset, int bucketCount) async {
    final assets = await _timelineService.loadAssets(offset, bucketCount);
    final selectedAssets = state.selectedAssets.toSet();

    for (final asset in assets) {
      if (!selectedAssets.contains(asset)) {
        selectedAssets.add(asset);
      }
    }

    state = state.copyWith(
      selectedAssets: selectedAssets.toList(),
    );
  }

  void deselectBucket(int offset, int bucketCount) async {
    final assets = await _timelineService.loadAssets(offset, bucketCount);
    final selectedAssets = state.selectedAssets.toSet();

    for (final asset in assets) {
      if (selectedAssets.contains(asset)) {
        selectedAssets.remove(asset);
      }
    }

    state = state.copyWith(
      selectedAssets: selectedAssets.toList(),
    );
  }

  void toggleBucketSelection(int offset, int bucketCount) {
    if (state.selectedAssets.isEmpty) {
      selectBucket(offset, bucketCount);
    } else {
      deselectBucket(offset, bucketCount);
    }
  }
}
