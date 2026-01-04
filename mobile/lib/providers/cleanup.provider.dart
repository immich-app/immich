import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/services/cleanup.service.dart';

class CleanupState {
  final DateTime? selectedDate;
  final List<LocalAsset> assetsToDelete;
  final bool isScanning;
  final bool isDeleting;

  const CleanupState({
    this.selectedDate,
    this.assetsToDelete = const [],
    this.isScanning = false,
    this.isDeleting = false,
  });

  CleanupState copyWith({
    DateTime? selectedDate,
    List<LocalAsset>? assetsToDelete,
    bool? isScanning,
    bool? isDeleting,
  }) {
    return CleanupState(
      selectedDate: selectedDate ?? this.selectedDate,
      assetsToDelete: assetsToDelete ?? this.assetsToDelete,
      isScanning: isScanning ?? this.isScanning,
      isDeleting: isDeleting ?? this.isDeleting,
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

  Future<void> scanAssets() async {
    if (_userId == null || state.selectedDate == null) {
      return;
    }

    state = state.copyWith(isScanning: true);
    try {
      final assets = await _cleanupService.getRemovalCandidates(_userId, state.selectedDate!);
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
