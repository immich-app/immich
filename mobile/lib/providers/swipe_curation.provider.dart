import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/services/action.service.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:logging/logging.dart';

/// Batch size for loading assets at a time
const int kSwipeBatchSize = 50;

/// State for the swipe-based curation feature
class SwipeCurationState {
  final List<RemoteAsset> assets;
  final int currentIndex;
  final int keptCount;
  final int trashedCount;
  final List<String> trashedIds;
  final Map<int, AxisDirection> swipeHistory;
  final int commitIndex;
  final bool isLoading;
  final bool isProcessing;
  final int totalAssets;
  final int totalReviewed;
  final bool hasMorePhotos;
  final Set<String> favoritedIds;
  final Offset swipeOffset;

  const SwipeCurationState({
    this.assets = const [],
    this.currentIndex = 0,
    this.keptCount = 0,
    this.trashedCount = 0,
    this.trashedIds = const [],
    this.swipeHistory = const {},
    this.commitIndex = 0,
    this.isLoading = true,
    this.isProcessing = false,
    this.totalAssets = 0,
    this.totalReviewed = 0,
    this.hasMorePhotos = true,
    this.favoritedIds = const {},
    this.swipeOffset = Offset.zero,
  });

  bool get batchFinished => !isLoading && currentIndex >= assets.length;

  SwipeCurationState copyWith({
    List<RemoteAsset>? assets,
    int? currentIndex,
    int? keptCount,
    int? trashedCount,
    List<String>? trashedIds,
    Map<int, AxisDirection>? swipeHistory,
    int? commitIndex,
    bool? isLoading,
    bool? isProcessing,
    int? totalAssets,
    int? totalReviewed,
    bool? hasMorePhotos,
    Set<String>? favoritedIds,
    Offset? swipeOffset,
  }) {
    return SwipeCurationState(
      assets: assets ?? this.assets,
      currentIndex: currentIndex ?? this.currentIndex,
      keptCount: keptCount ?? this.keptCount,
      trashedCount: trashedCount ?? this.trashedCount,
      trashedIds: trashedIds ?? this.trashedIds,
      swipeHistory: swipeHistory ?? this.swipeHistory,
      commitIndex: commitIndex ?? this.commitIndex,
      isLoading: isLoading ?? this.isLoading,
      isProcessing: isProcessing ?? this.isProcessing,
      totalAssets: totalAssets ?? this.totalAssets,
      totalReviewed: totalReviewed ?? this.totalReviewed,
      hasMorePhotos: hasMorePhotos ?? this.hasMorePhotos,
      favoritedIds: favoritedIds ?? this.favoritedIds,
      swipeOffset: swipeOffset ?? this.swipeOffset,
    );
  }
}

final swipeCurationProvider =
    StateNotifierProvider<SwipeCurationNotifier, SwipeCurationState>((ref) {
  return SwipeCurationNotifier(
    ref.watch(actionServiceProvider),
    ref.watch(appSettingsServiceProvider),
    ref.watch(timelineFactoryProvider),
    ref.watch(currentUserProvider)?.id,
  );
});

class SwipeCurationNotifier extends StateNotifier<SwipeCurationState> {
  final ActionService _actionService;
  final AppSettingsService _appSettings;
  final TimelineFactory _timelineFactory;
  final String? _userId;
  final Logger _logger = Logger('SwipeCurationNotifier');

  TimelineService? _timelineService;
  int _loadOffset = 0;

  SwipeCurationNotifier(
    this._actionService,
    this._appSettings,
    this._timelineFactory,
    this._userId,
  ) : super(const SwipeCurationState()) {
    _loadPersistedProgress();
  }

  void _loadPersistedProgress() {
    final lastReviewedId =
        _appSettings.getSetting(AppSettingsEnum.swipeLastReviewedId);
    final totalReviewed =
        _appSettings.getSetting(AppSettingsEnum.swipeTotalReviewed);

    if (lastReviewedId.isNotEmpty || totalReviewed > 0) {
      state = state.copyWith(totalReviewed: totalReviewed);
      _logger.info(
          '[SwipeCuration] Restored progress: totalReviewed=$totalReviewed, lastId=$lastReviewedId');
    }
  }

  Future<void> _saveProgress(String assetId) async {
    await _appSettings.setSetting(
        AppSettingsEnum.swipeLastReviewedId, assetId);
    await _appSettings.setSetting(
        AppSettingsEnum.swipeTotalReviewed,
        state.totalReviewed + state.keptCount + state.trashedCount);
  }

  /// Initialize the timeline and load the first batch
  Future<void> loadInitialBatch() async {
    if (_userId == null) return;

    state = state.copyWith(isLoading: true);

    try {
      // Use the main timeline (all remote assets, newest first)
      _timelineService = _timelineFactory.remoteAssets(_userId);

      // Wait for the timeline to initialize with buckets
      await Future.delayed(const Duration(milliseconds: 500));

      final totalAssets = _timelineService!.totalAssets;
      state = state.copyWith(totalAssets: totalAssets);

      // Try to resume from where user left off
      final lastReviewedId =
          _appSettings.getSetting(AppSettingsEnum.swipeLastReviewedId);

      if (lastReviewedId.isNotEmpty) {
        // Search for the last reviewed ID in the timeline to find
        // the resume offset
        await _findResumeOffset(lastReviewedId, totalAssets);
      }

      await _loadBatch();
    } catch (e, stack) {
      _logger.severe('Failed to load initial batch', e, stack);
      state = state.copyWith(isLoading: false);
    }
  }

  Future<void> _findResumeOffset(String lastId, int totalAssets) async {
    // Search through the timeline in chunks to find where we left off
    const searchChunkSize = 200;
    for (int offset = 0; offset < totalAssets; offset += searchChunkSize) {
      final count =
          (offset + searchChunkSize > totalAssets)
              ? totalAssets - offset
              : searchChunkSize;
      try {
        final assets = await _timelineService!.loadAssets(offset, count);
        final idx = assets.indexWhere(
          (a) => a is RemoteAsset && a.id == lastId,
        );
        if (idx >= 0) {
          _loadOffset = offset + idx + 1; // Start after the last reviewed
          _logger.info(
              '[SwipeCuration] Found resume point at offset $_loadOffset');
          return;
        }
      } catch (e) {
        _logger.warning('[SwipeCuration] Error searching offset $offset: $e');
        break;
      }
    }
    // If not found, start from the beginning
    _loadOffset = 0;
  }

  Future<void> _loadBatch() async {
    if (_timelineService == null) return;

    state = state.copyWith(isLoading: true);

    try {
      final totalAssets = _timelineService!.totalAssets;
      final remaining = totalAssets - _loadOffset;
      final count = remaining < kSwipeBatchSize ? remaining : kSwipeBatchSize;

      if (count <= 0) {
        state = state.copyWith(
          assets: [],
          isLoading: false,
          hasMorePhotos: false,
        );
        return;
      }

      final assets = await _timelineService!.loadAssets(_loadOffset, count);
      final remoteAssets =
          assets.whereType<RemoteAsset>().toList(growable: false);

      state = state.copyWith(
        assets: remoteAssets,
        currentIndex: 0,
        commitIndex: 0,
        keptCount: 0,
        trashedCount: 0,
        trashedIds: [],
        swipeHistory: {},
        isLoading: false,
        hasMorePhotos: (_loadOffset + count) < totalAssets,
        swipeOffset: Offset.zero,
      );
    } catch (e, stack) {
      _logger.severe('Failed to load batch', e, stack);
      state = state.copyWith(isLoading: false, hasMorePhotos: false);
    }
  }

  /// Load the next batch of photos
  Future<void> loadNextBatch() async {
    // Accumulate total reviewed count
    final batchPhotoCount = state.assets.length;
    state = state.copyWith(
      totalReviewed: state.totalReviewed + batchPhotoCount,
    );

    _loadOffset += batchPhotoCount;
    await _loadBatch();
  }

  /// Handle a swipe event
  void onSwipe(int previousIndex, AxisDirection direction) {
    if (previousIndex >= state.assets.length) return;

    final asset = state.assets[previousIndex];
    final newHistory = Map<int, AxisDirection>.from(state.swipeHistory);
    newHistory[previousIndex] = direction;

    if (direction == AxisDirection.left) {
      // Trashed
      state = state.copyWith(
        currentIndex: state.currentIndex + 1,
        trashedCount: state.trashedCount + 1,
        trashedIds: [...state.trashedIds, asset.id],
        swipeHistory: newHistory,
        swipeOffset: Offset.zero,
      );
    } else if (direction == AxisDirection.right) {
      // Kept
      state = state.copyWith(
        currentIndex: state.currentIndex + 1,
        keptCount: state.keptCount + 1,
        swipeHistory: newHistory,
        swipeOffset: Offset.zero,
      );
    }

    // Persist progress
    _saveProgress(asset.id);
  }

  /// Undo the last swipe
  void undoSwipe() {
    if (state.currentIndex <= state.commitIndex) return;

    final prevIndex = state.currentIndex - 1;
    final prevDirection = state.swipeHistory[prevIndex];
    final newHistory = Map<int, AxisDirection>.from(state.swipeHistory);
    newHistory.remove(prevIndex);

    if (prevDirection == AxisDirection.left) {
      final newTrashedIds = List<String>.from(state.trashedIds);
      if (newTrashedIds.isNotEmpty) newTrashedIds.removeLast();
      state = state.copyWith(
        currentIndex: prevIndex,
        trashedCount: state.trashedCount - 1,
        trashedIds: newTrashedIds,
        swipeHistory: newHistory,
      );
    } else if (prevDirection == AxisDirection.right) {
      state = state.copyWith(
        currentIndex: prevIndex,
        keptCount: state.keptCount - 1,
        swipeHistory: newHistory,
      );
    }
  }

  /// Trash all left-swiped photos on the Immich server
  Future<void> emptyTrash() async {
    if (state.trashedIds.isEmpty) return;

    state = state.copyWith(isProcessing: true);

    try {
      await _actionService.trash(state.trashedIds);
      _logger.info(
          '[SwipeCuration] Trashed ${state.trashedIds.length} assets on server');

      state = state.copyWith(
        trashedIds: [],
        commitIndex: state.currentIndex,
        isProcessing: false,
      );
    } catch (e, stack) {
      _logger.severe('Failed to empty trash', e, stack);
      state = state.copyWith(isProcessing: false);
    }
  }

  /// Favorite a specific asset
  Future<void> favoriteAsset(String assetId) async {
    try {
      final isFavorited = state.favoritedIds.contains(assetId);
      if (isFavorited) {
        await _actionService.unFavorite([assetId]);
        final newFavs = Set<String>.from(state.favoritedIds);
        newFavs.remove(assetId);
        state = state.copyWith(favoritedIds: newFavs);
      } else {
        await _actionService.favorite([assetId]);
        final newFavs = Set<String>.from(state.favoritedIds);
        newFavs.add(assetId);
        state = state.copyWith(favoritedIds: newFavs);
      }
    } catch (e) {
      _logger.warning('[SwipeCuration] Failed to toggle favorite: $e');
    }
  }

  /// Update the swipe offset for UI feedback
  void updateSwipeOffset(Offset offset) {
    state = state.copyWith(swipeOffset: offset);
  }

  /// Reset swipe offset
  void resetSwipeOffset() {
    state = state.copyWith(swipeOffset: Offset.zero);
  }

  /// Start over from the beginning
  Future<void> startOver() async {
    _loadOffset = 0;
    state = const SwipeCurationState();
    await _appSettings.setSetting(AppSettingsEnum.swipeLastReviewedId, "");
    await _appSettings.setSetting(AppSettingsEnum.swipeTotalReviewed, 0);
    await loadInitialBatch();
  }

  @override
  void dispose() {
    _timelineService?.dispose();
    super.dispose();
  }
}
