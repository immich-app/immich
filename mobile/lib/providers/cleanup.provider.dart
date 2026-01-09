import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/services/cleanup.service.dart';

class CleanupState {
  final DateTime? selectedDate;
  final List<LocalAsset> assetsToDelete;
  final bool isScanning;
  final bool isDeleting;
  final AssetFilterType filterType;
  final bool keepFavorites;

  const CleanupState({
    this.selectedDate,
    this.assetsToDelete = const [],
    this.isScanning = false,
    this.isDeleting = false,
    this.filterType = AssetFilterType.all,
    this.keepFavorites = true,
  });

  CleanupState copyWith({
    DateTime? selectedDate,
    List<LocalAsset>? assetsToDelete,
    bool? isScanning,
    bool? isDeleting,
    AssetFilterType? filterType,
    bool? keepFavorites,
  }) {
    return CleanupState(
      selectedDate: selectedDate ?? this.selectedDate,
      assetsToDelete: assetsToDelete ?? this.assetsToDelete,
      isScanning: isScanning ?? this.isScanning,
      isDeleting: isDeleting ?? this.isDeleting,
      filterType: filterType ?? this.filterType,
      keepFavorites: keepFavorites ?? this.keepFavorites,
    );
  }
}

final cleanupProvider = StateNotifierProvider<CleanupNotifier, CleanupState>((ref) {
  return CleanupNotifier(ref.watch(cleanupServiceProvider), ref.watch(currentUserProvider)?.id);
});

class CleanupNotifier extends StateNotifier<CleanupState> {
  final CleanupService _cleanupService;
  final String? _userId;

  CleanupNotifier(this._cleanupService, this._userId) : super(const CleanupState());

  void setSelectedDate(DateTime? date) {
    state = state.copyWith(selectedDate: date, assetsToDelete: []);
  }

  void setFilterType(AssetFilterType filterType) {
    state = state.copyWith(filterType: filterType, assetsToDelete: []);
  }

  void setKeepFavorites(bool keepFavorites) {
    state = state.copyWith(keepFavorites: keepFavorites, assetsToDelete: []);
  }

  Future<void> scanAssets() async {
    if (_userId == null || state.selectedDate == null) {
      return;
    }

    state = state.copyWith(isScanning: true);
    try {
      final assets = await _cleanupService.getRemovalCandidates(
        _userId,
        state.selectedDate!,
        filterType: state.filterType,
        keepFavorites: state.keepFavorites,
      );
      state = state.copyWith(assetsToDelete: assets, isScanning: false);
    } catch (e) {
      state = state.copyWith(isScanning: false);
      rethrow;
    }
  }

  Future<int> deleteAssets() async {
    if (state.assetsToDelete.isEmpty) {
      return 0;
    }

    state = state.copyWith(isDeleting: true);
    try {
      final deletedCount = await _cleanupService.deleteLocalAssets(state.assetsToDelete.map((a) => a.id).toList());

      state = state.copyWith(assetsToDelete: [], isDeleting: false);

      return deletedCount;
    } catch (e) {
      state = state.copyWith(isDeleting: false);
      rethrow;
    }
  }

  void reset() {
    state = const CleanupState();
  }
}
