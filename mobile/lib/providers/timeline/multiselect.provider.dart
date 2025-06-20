import 'package:collection/collection.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';

final multiSelectProvider =
    StateNotifierProvider<MultiSelectProviderNotifier, MultiSelectState>(
  (ref) => MultiSelectProviderNotifier(),
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
  MultiSelectProviderNotifier()
      : super(
          MultiSelectState(selectedAssets: []),
        );

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
}
