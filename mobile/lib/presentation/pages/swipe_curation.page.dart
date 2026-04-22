import 'package:appinio_swiper/appinio_swiper.dart';
import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/presentation/widgets/swipe/swipe_card.widget.dart';
import 'package:immich_mobile/providers/swipe_curation.provider.dart';

@RoutePage()
class SwipeCurationPage extends ConsumerStatefulWidget {
  const SwipeCurationPage({super.key});

  @override
  ConsumerState<SwipeCurationPage> createState() => _SwipeCurationPageState();
}

class _SwipeCurationPageState extends ConsumerState<SwipeCurationPage> {
  final AppinioSwiperController _swiperController = AppinioSwiperController();

  @override
  void initState() {
    super.initState();
    // Load assets on first frame
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(swipeCurationProvider.notifier).loadInitialBatch();
    });
  }

  @override
  void dispose() {
    _swiperController.dispose();
    super.dispose();
  }

  void _onSwipeEnd(
      int previousIndex, int targetIndex, SwiperActivity activity) {
    if (activity is Swipe) {
      ref
          .read(swipeCurationProvider.notifier)
          .onSwipe(previousIndex, activity.direction);
    }
  }

  void _undoSwipe() {
    _swiperController.unswipe();
    ref.read(swipeCurationProvider.notifier).undoSwipe();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(swipeCurationProvider);

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            // Progress bar
            _buildProgressBar(context, state),
            // Main content
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                child: state.isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : state.assets.isEmpty
                        ? _buildEmptyState(context)
                        : Stack(
                            children: [
                              if (!state.batchFinished)
                                AppinioSwiper(
                                  controller: _swiperController,
                                  cardCount: state.assets.length,
                                  swipeOptions: const SwipeOptions.only(
                                      left: true, right: true),
                                  onSwipeEnd: _onSwipeEnd,
                                  onCardPositionChanged: (position) {
                                    ref
                                        .read(
                                            swipeCurationProvider.notifier)
                                        .updateSwipeOffset(position.offset);
                                  },
                                  onSwipeCancelled: (_) {
                                    ref
                                        .read(
                                            swipeCurationProvider.notifier)
                                        .resetSwipeOffset();
                                  },
                                  cardBuilder: (context, index) {
                                    final asset = state.assets[index];
                                    return SwipeCard(
                                      asset: asset,
                                      isBackground:
                                          index != state.currentIndex,
                                      isFavorited: state.favoritedIds
                                              .contains(asset.id) ||
                                          asset.isFavorite,
                                      swipeOffset: index ==
                                              state.currentIndex
                                          ? state.swipeOffset
                                          : Offset.zero,
                                      onDoubleTap: () {
                                        ref
                                            .read(swipeCurationProvider
                                                .notifier)
                                            .favoriteAsset(asset.id);
                                      },
                                      onFavoriteTap: () {
                                        ref
                                            .read(swipeCurationProvider
                                                .notifier)
                                            .favoriteAsset(asset.id);
                                      },
                                    );
                                  },
                                ),
                              if (state.batchFinished)
                                _buildBatchEndScreen(context, state),
                            ],
                          ),
              ),
            ),
            // Bottom actions
            if (!state.batchFinished && state.assets.isNotEmpty)
              _buildBottomActions(context, state),
          ],
        ),
      ),
      // Processing overlay
      floatingActionButton: state.isProcessing
          ? Container(
              color: Colors.black54,
              child: const Center(child: CircularProgressIndicator()),
            )
          : null,
    );
  }

  Widget _buildProgressBar(BuildContext context, SwipeCurationState state) {
    final batchTotal = state.assets.length;
    final batchReviewed =
        state.batchFinished ? batchTotal : state.keptCount + state.trashedCount;
    final totalReviewed = state.totalReviewed + batchReviewed;
    final total =
        state.totalAssets > 0 ? state.totalAssets : batchTotal;
    final progress = total > 0 ? totalReviewed / total : 0.0;

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 4),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '$totalReviewed of $total reviewed',
                style: context.textTheme.bodySmall?.copyWith(
                  color: context.colorScheme.onSurfaceVariant,
                ),
              ),
              Row(
                children: [
                  Icon(Icons.check_circle_rounded,
                      size: 14, color: Colors.green.shade400),
                  const SizedBox(width: 4),
                  Text(
                    '${state.keptCount}',
                    style: context.textTheme.bodySmall?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: Colors.green.shade400,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Icon(Icons.delete_rounded,
                      size: 14,
                      color: context.colorScheme.error),
                  const SizedBox(width: 4),
                  Text(
                    '${state.trashedCount}',
                    style: context.textTheme.bodySmall?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: context.colorScheme.error,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progress.clamp(0.0, 1.0),
              minHeight: 4,
              backgroundColor: context.colorScheme.surfaceContainerHighest,
              valueColor: AlwaysStoppedAnimation<Color>(
                  context.primaryColor),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.check_circle_outline_rounded,
            size: 72,
            color: context.colorScheme.primary.withValues(alpha: 0.5),
          ),
          const SizedBox(height: 16),
          Text(
            'All Clean!',
            style: context.textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'No photos to review right now.',
            style: context.textTheme.bodyMedium?.copyWith(
              color: context.colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 32),
          FilledButton.tonal(
            onPressed: () {
              ref.read(swipeCurationProvider.notifier).startOver();
            },
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.refresh_rounded, size: 18),
                SizedBox(width: 8),
                Text('Review Again'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBatchEndScreen(
      BuildContext context, SwipeCurationState state) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.task_alt_rounded,
            size: 72,
            color: Colors.green.shade400,
          ),
          const SizedBox(height: 24),
          Text(
            'Batch Complete!',
            style: context.textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'You reviewed ${state.assets.length} photos.',
            style: context.textTheme.bodyMedium?.copyWith(
              color: context.colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 40),
          // Empty Trash button
          if (state.trashedIds.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: FilledButton(
                onPressed: () {
                  ref.read(swipeCurationProvider.notifier).emptyTrash();
                },
                style: FilledButton.styleFrom(
                  backgroundColor: context.colorScheme.error,
                  foregroundColor: context.colorScheme.onError,
                  minimumSize: const Size(250, 52),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.delete_outline_rounded, size: 20),
                    const SizedBox(width: 8),
                    Text(
                      'Empty Trash (${state.trashedIds.length})',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          // Next batch
          if (state.hasMorePhotos)
            FilledButton.tonal(
              onPressed: () {
                ref.read(swipeCurationProvider.notifier).loadNextBatch();
              },
              style: FilledButton.styleFrom(
                minimumSize: const Size(250, 52),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              child: Text(
                'Review Next $kSwipeBatchSize',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          if (!state.hasMorePhotos)
            FilledButton.tonal(
              onPressed: () {
                ref.read(swipeCurationProvider.notifier).startOver();
              },
              style: FilledButton.styleFrom(
                minimumSize: const Size(250, 52),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.refresh_rounded, size: 18),
                  SizedBox(width: 8),
                  Text(
                    'Review Again',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          const SizedBox(height: 16),
          // Start over
          TextButton(
            onPressed: () {
              _confirmStartOver(context);
            },
            child: const Text('Start Over From Beginning'),
          ),
        ],
      ),
    );
  }

  void _confirmStartOver(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Start Over?'),
        content: const Text(
          'This will reset your progress and start reviewing from the most recent photo.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.pop(context);
              ref.read(swipeCurationProvider.notifier).startOver();
            },
            child: const Text('Start Over'),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomActions(
      BuildContext context, SwipeCurationState state) {
    final canUndo = state.currentIndex > state.commitIndex &&
        state.currentIndex <= state.assets.length;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Start over button
          IconButton.filledTonal(
            onPressed: () => _confirmStartOver(context),
            icon: const Icon(Icons.refresh_rounded, size: 22),
            tooltip: 'Start Over',
          ),
          // Empty Trash button
          FilledButton(
            onPressed: state.trashedIds.isNotEmpty
                ? () {
                    ref
                        .read(swipeCurationProvider.notifier)
                        .emptyTrash();
                  }
                : null,
            style: FilledButton.styleFrom(
              backgroundColor: state.trashedIds.isNotEmpty
                  ? context.colorScheme.error
                  : context.colorScheme.surfaceContainerHighest,
              foregroundColor: state.trashedIds.isNotEmpty
                  ? context.colorScheme.onError
                  : context.colorScheme.onSurfaceVariant,
              padding:
                  const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(30),
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.delete_outline_rounded, size: 18),
                const SizedBox(width: 8),
                Text(
                  'Trash (${state.trashedIds.length})',
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          // Undo button
          IconButton.filledTonal(
            onPressed: canUndo ? _undoSwipe : null,
            icon: const Icon(Icons.undo_rounded, size: 22),
            tooltip: 'Undo',
          ),
        ],
      ),
    );
  }
}
