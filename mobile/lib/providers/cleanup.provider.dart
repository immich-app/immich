import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/repositories/metadata.repository.dart';
import 'package:immich_mobile/providers/infrastructure/metadata.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/services/cleanup.service.dart';

class CleanupState {
  final DateTime? selectedDate;
  final List<LocalAsset> assetsToDelete;
  final int totalBytes;
  final bool isScanning;
  final bool isDeleting;
  final AssetKeepType keepMediaType;
  final bool keepFavorites;
  final Set<String> keepAlbumIds;

  const CleanupState({
    this.selectedDate,
    this.assetsToDelete = const [],
    this.totalBytes = 0,
    this.isScanning = false,
    this.isDeleting = false,
    this.keepMediaType = AssetKeepType.none,
    this.keepFavorites = true,
    this.keepAlbumIds = const {},
  });

  CleanupState copyWith({
    DateTime? selectedDate,
    List<LocalAsset>? assetsToDelete,
    int? totalBytes,
    bool? isScanning,
    bool? isDeleting,
    AssetKeepType? keepMediaType,
    bool? keepFavorites,
    Set<String>? keepAlbumIds,
  }) {
    return CleanupState(
      selectedDate: selectedDate ?? this.selectedDate,
      assetsToDelete: assetsToDelete ?? this.assetsToDelete,
      totalBytes: totalBytes ?? this.totalBytes,
      isScanning: isScanning ?? this.isScanning,
      isDeleting: isDeleting ?? this.isDeleting,
      keepMediaType: keepMediaType ?? this.keepMediaType,
      keepFavorites: keepFavorites ?? this.keepFavorites,
      keepAlbumIds: keepAlbumIds ?? this.keepAlbumIds,
    );
  }
}

final cleanupProvider = StateNotifierProvider<CleanupNotifier, CleanupState>((ref) {
  return CleanupNotifier(
    ref.watch(cleanupServiceProvider),
    ref.watch(currentUserProvider)?.id,
    ref.watch(metadataProvider),
  );
});

class CleanupNotifier extends StateNotifier<CleanupState> {
  final CleanupService _cleanupService;
  final String? _userId;
  final MetadataRepository _metadataRepository;

  CleanupNotifier(this._cleanupService, this._userId, this._metadataRepository) : super(const CleanupState()) {
    _loadPersistedSettings();
  }

  void _loadPersistedSettings() {
    final cleanup = _metadataRepository.appConfig.cleanup;
    final keepFavorites = cleanup.keepFavorites;
    final keepMediaType = cleanup.keepMediaType;
    final keepAlbumIds = cleanup.keepAlbumIds.toSet();
    final cutoffDaysAgo = cleanup.cutoffDaysAgo;
    final selectedDate = cutoffDaysAgo >= 0 ? DateTime.now().subtract(Duration(days: cutoffDaysAgo)) : null;

    state = state.copyWith(
      keepFavorites: keepFavorites,
      keepMediaType: keepMediaType,
      keepAlbumIds: keepAlbumIds,
      selectedDate: selectedDate,
    );
  }

  void setSelectedDate(DateTime? date) {
    state = state.copyWith(selectedDate: date, assetsToDelete: []);
    if (date != null) {
      final daysAgo = DateTime.now().difference(date).inDays;
      _metadataRepository.write(.cleanupCutoffDaysAgo, daysAgo);
    }
  }

  void setKeepMediaType(AssetKeepType keepMediaType) {
    state = state.copyWith(keepMediaType: keepMediaType, assetsToDelete: []);
    _metadataRepository.write(.cleanupKeepMediaType, keepMediaType);
  }

  void setKeepFavorites(bool keepFavorites) {
    state = state.copyWith(keepFavorites: keepFavorites, assetsToDelete: []);
    _metadataRepository.write(.cleanupKeepFavorites, keepFavorites);
  }

  void toggleKeepAlbum(String albumId) {
    final newKeepAlbumIds = Set<String>.from(state.keepAlbumIds);
    if (newKeepAlbumIds.contains(albumId)) {
      newKeepAlbumIds.remove(albumId);
    } else {
      newKeepAlbumIds.add(albumId);
    }
    state = state.copyWith(keepAlbumIds: newKeepAlbumIds, assetsToDelete: []);
    _persistExcludedAlbumIds(newKeepAlbumIds);
  }

  void setExcludedAlbumIds(Set<String> albumIds) {
    state = state.copyWith(keepAlbumIds: albumIds, assetsToDelete: []);
    _persistExcludedAlbumIds(albumIds);
  }

  void _persistExcludedAlbumIds(Set<String> albumIds) {
    _metadataRepository.write(.cleanupKeepAlbumIds, albumIds.toList());
  }

  void cleanupStaleAlbumIds(Set<String> existingAlbumIds) {
    final staleIds = state.keepAlbumIds.difference(existingAlbumIds);
    if (staleIds.isNotEmpty) {
      final cleanedIds = state.keepAlbumIds.intersection(existingAlbumIds);
      state = state.copyWith(keepAlbumIds: cleanedIds);
      _persistExcludedAlbumIds(cleanedIds);
    }
  }

  void applyDefaultAlbumSelections(List<(String id, String name)> albums) {
    final isInitialized = _metadataRepository.appConfig.cleanup.defaultsInitialized;
    if (isInitialized) return;

    final toKeep = _cleanupService.getDefaultKeepAlbumIds(albums);

    if (toKeep.isNotEmpty) {
      final keepAlbumIds = {...state.keepAlbumIds, ...toKeep};
      state = state.copyWith(keepAlbumIds: keepAlbumIds);
      _persistExcludedAlbumIds(keepAlbumIds);
    }

    _metadataRepository.write(.cleanupDefaultsInitialized, true);
  }

  Future<void> scanAssets() async {
    if (_userId == null || state.selectedDate == null) {
      return;
    }

    state = state.copyWith(isScanning: true);
    try {
      final result = await _cleanupService.getRemovalCandidates(
        _userId,
        state.selectedDate!,
        keepMediaType: state.keepMediaType,
        keepFavorites: state.keepFavorites,
        keepAlbumIds: state.keepAlbumIds,
      );

      state = state.copyWith(assetsToDelete: result.assets, totalBytes: result.totalBytes, isScanning: false);
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
    // Only reset transient state, keep the persisted filter settings
    state = state.copyWith(selectedDate: null, assetsToDelete: [], isScanning: false, isDeleting: false);
  }
}
