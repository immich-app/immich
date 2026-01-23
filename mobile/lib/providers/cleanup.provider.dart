import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/services/cleanup.service.dart';

class CleanupState {
  final DateTime? selectedDate;
  final List<LocalAsset> assetsToDelete;
  final bool isScanning;
  final bool isDeleting;
  final AssetKeepType keepMediaType;
  final bool keepFavorites;
  final Set<String> excludedAlbumIds;

  const CleanupState({
    this.selectedDate,
    this.assetsToDelete = const [],
    this.isScanning = false,
    this.isDeleting = false,
    this.keepMediaType = AssetKeepType.none,
    this.keepFavorites = true,
    this.excludedAlbumIds = const {},
  });

  CleanupState copyWith({
    DateTime? selectedDate,
    List<LocalAsset>? assetsToDelete,
    bool? isScanning,
    bool? isDeleting,
    AssetKeepType? keepMediaType,
    bool? keepFavorites,
    Set<String>? excludedAlbumIds,
  }) {
    return CleanupState(
      selectedDate: selectedDate ?? this.selectedDate,
      assetsToDelete: assetsToDelete ?? this.assetsToDelete,
      isScanning: isScanning ?? this.isScanning,
      isDeleting: isDeleting ?? this.isDeleting,
      keepMediaType: keepMediaType ?? this.keepMediaType,
      keepFavorites: keepFavorites ?? this.keepFavorites,
      excludedAlbumIds: excludedAlbumIds ?? this.excludedAlbumIds,
    );
  }
}

final cleanupProvider = StateNotifierProvider<CleanupNotifier, CleanupState>((ref) {
  return CleanupNotifier(
    ref.watch(cleanupServiceProvider),
    ref.watch(currentUserProvider)?.id,
    ref.watch(appSettingsServiceProvider),
  );
});

class CleanupNotifier extends StateNotifier<CleanupState> {
  final CleanupService _cleanupService;
  final String? _userId;
  final AppSettingsService _appSettingsService;

  CleanupNotifier(this._cleanupService, this._userId, this._appSettingsService) : super(const CleanupState()) {
    _loadPersistedSettings();
  }

  void _loadPersistedSettings() {
    final keepFavorites = _appSettingsService.getSetting(AppSettingsEnum.cleanupKeepFavorites);
    final keepMediaTypeIndex = _appSettingsService.getSetting(AppSettingsEnum.cleanupKeepMediaType);
    final excludedAlbumIdsString = _appSettingsService.getSetting(AppSettingsEnum.cleanupExcludedAlbumIds);
    final cutoffDaysAgo = _appSettingsService.getSetting(AppSettingsEnum.cleanupCutoffDaysAgo);

    final keepMediaType = AssetKeepType.values[keepMediaTypeIndex.clamp(0, AssetKeepType.values.length - 1)];
    final excludedAlbumIds = excludedAlbumIdsString.isEmpty ? <String>{} : excludedAlbumIdsString.split(',').toSet();
    final selectedDate = cutoffDaysAgo > 0 ? DateTime.now().subtract(Duration(days: cutoffDaysAgo)) : null;

    state = state.copyWith(
      keepFavorites: keepFavorites,
      keepMediaType: keepMediaType,
      excludedAlbumIds: excludedAlbumIds,
      selectedDate: selectedDate,
    );
  }

  void setSelectedDate(DateTime? date) {
    state = state.copyWith(selectedDate: date, assetsToDelete: []);
    if (date != null) {
      final daysAgo = DateTime.now().difference(date).inDays;
      _appSettingsService.setSetting(AppSettingsEnum.cleanupCutoffDaysAgo, daysAgo);
    }
  }

  void setKeepMediaType(AssetKeepType keepMediaType) {
    state = state.copyWith(keepMediaType: keepMediaType, assetsToDelete: []);
    _appSettingsService.setSetting(AppSettingsEnum.cleanupKeepMediaType, keepMediaType.index);
  }

  void setKeepFavorites(bool keepFavorites) {
    state = state.copyWith(keepFavorites: keepFavorites, assetsToDelete: []);
    _appSettingsService.setSetting(AppSettingsEnum.cleanupKeepFavorites, keepFavorites);
  }

  void toggleExcludedAlbum(String albumId) {
    final newExcludedAlbumIds = Set<String>.from(state.excludedAlbumIds);
    if (newExcludedAlbumIds.contains(albumId)) {
      newExcludedAlbumIds.remove(albumId);
    } else {
      newExcludedAlbumIds.add(albumId);
    }
    state = state.copyWith(excludedAlbumIds: newExcludedAlbumIds, assetsToDelete: []);
    _persistExcludedAlbumIds(newExcludedAlbumIds);
  }

  void setExcludedAlbumIds(Set<String> albumIds) {
    state = state.copyWith(excludedAlbumIds: albumIds, assetsToDelete: []);
    _persistExcludedAlbumIds(albumIds);
  }

  void _persistExcludedAlbumIds(Set<String> albumIds) {
    _appSettingsService.setSetting(AppSettingsEnum.cleanupExcludedAlbumIds, albumIds.join(','));
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
        keepMediaType: state.keepMediaType,
        keepFavorites: state.keepFavorites,
        excludedAlbumIds: state.excludedAlbumIds,
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
    // Only reset transient state, keep the persisted filter settings
    state = state.copyWith(selectedDate: null, assetsToDelete: [], isScanning: false, isDeleting: false);
  }
}
