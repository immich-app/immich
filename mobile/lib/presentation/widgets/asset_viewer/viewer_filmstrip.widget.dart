import 'dart:math';

import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/presentation/widgets/images/thumbnail.widget.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';

/// Filmstrip of thumbnails shown at the bottom of the viewer.
class ViewerFilmstrip extends ConsumerStatefulWidget {
  const ViewerFilmstrip({super.key});

  @override
  ConsumerState<ViewerFilmstrip> createState() => _ViewerFilmstripState();
}

class _ViewerFilmstripState extends ConsumerState<ViewerFilmstrip> {
  static const double _itemGap = 2.0;

  late double _filmstripHeight;
  late double _itemExtent;
  int _visibleCount = 0;

  late final ScrollController _scrollController;
  late TimelineService _timelineService;

  /// Tracks the currently running assets loading operation to avoid concurrent loads.
  Future<void>? _loadTask;
  /// True when _loadTask is already awaited. We only need one follow-up caller to await the task to
  /// reflect to most recent state if there were further requests while _loadTask was running.
  bool _isLoadTaskAwaited = false;

  /// Internal current index to track what asset filmstrip is currently displaying.
  /// This is in contrast to the currentIndex in provider. Differentiating the two
  /// allows us to react properly to external vs internal changes.
  /// It is also notifier to trigger restyling of the currently centered thumbnail.
  late final ValueNotifier<int> _currentIndex;

  /// Flag to track if the user is currently scrubbing through the filmstrip.
  bool _isScrubbing = false;

  /// Tracks whether the user is currently having their finger on the filmstrip. 
  bool _isPointerDown = false;

  void _applyHeight(double height) {
    _filmstripHeight = height;
    _itemExtent = height - 4;
  }

  @override
  void initState() {
    super.initState();
    final h = ref.read(appSettingsServiceProvider).getSetting<int>(AppSettingsEnum.filmstripHeight).toDouble();
    _applyHeight(h);
    _scrollController = ScrollController();
    _scrollController.addListener(_onScrollPositionChanged);
    _timelineService = ref.read(timelineServiceProvider);
    final initialIndex = ref.read(assetViewerProvider).currentIndex;
    _currentIndex = ValueNotifier(initialIndex);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _ensureLoaded();
      _scrollToCurrentIndex(animated: false);
      _scrollController.position.isScrollingNotifier.addListener(_onScrollingChanged);
    });
  }

  @override
  void dispose() {
    if (_scrollController.hasClients) {
      _scrollController.position.isScrollingNotifier.removeListener(_onScrollingChanged);
    }
    _scrollController.removeListener(_onScrollPositionChanged);
    _scrollController.dispose();
    _currentIndex.dispose();
    super.dispose();
  }

  /// Ensures the assets around current index are loaded.
  Future<void> _ensureLoaded() async {
    if (_visibleCount == 0) return;

    // Wait for any in-flight load to complete before starting a new one.
    if (_loadTask != null) {
      // We need only one caller to reflect the most recent state, the rest can be safely dropped.
      if (_isLoadTaskAwaited) return;
      _isLoadTaskAwaited = true;
      try {
        await _loadTask;
      } finally {
        _isLoadTaskAwaited = false;
      }
    }

    final idx = _currentIndex.value;
    final total = _timelineService.totalAssets;

    // Check if the expanded region around the current index is already cached.
    // This helps to start loading assets early before we reach uncached region.
    final triggerWindow = _visibleCount * 3;
    final startTriggerWindow = max(idx - triggerWindow ~/ 2, 0);
    final countTriggerWindow = min(triggerWindow, total - startTriggerWindow);
    if (_timelineService.hasRange(startTriggerWindow, countTriggerWindow)) return;

    // Load a larger buffer to reduce the frequency of loading during fast scrubbing.
    final bufferWindow = _visibleCount * 10;
    final start = max(idx - bufferWindow ~/ 2, 0);
    final count = min(bufferWindow, total - start);

    final loadAssetsTask = _timelineService.loadAssets(start, count);

    // After loading the assets, follow up with further actions.
    // We only want to allow reentry to _ensureLoaded once all of those are completed,
    // so we record the Future of those follow-up actions, which can then be awaited.
    _loadTask = loadAssetsTask.whenComplete(() {
      // We use placeholders for assets that are not cached in timeline when building filmstrip item.
      // This call will update the thumbnails in items once the assets are actually loaded.
      if (mounted) setState(() {});

      _loadTask = null;
    });    
  }

  /// Called when the provider's currentIndex changes.
  /// The reaction to taps is also routed through this listener.
  void _onIndexChanged(int? _, int idx) {
    if (idx == _currentIndex.value) return;
    _currentIndex.value = idx;

    _ensureLoaded();
    _scrollToCurrentIndex();
  }

  /// Updates the scroll position to center on the given index.
  void _scrollToCurrentIndex({bool animated = true}) {
    if (!_scrollController.hasClients) return;
    final index = _currentIndex.value;
    if (index < 0 || index >= _timelineService.totalAssets) return;

    final targetOffset = index.toDouble() * (_itemExtent + _itemGap);
    final clamped = targetOffset.clamp(
      _scrollController.position.minScrollExtent,
      _scrollController.position.maxScrollExtent,
    );

    if (animated) {
      _scrollController.animateTo(clamped, duration: const Duration(milliseconds: 200), curve: Curves.easeOut);
    } else {
      _scrollController.jumpTo(clamped);
    }
  }

  void _onTap(int idx) {
    // Tapped the already selected thumbnail, no-op.
    if (idx == _currentIndex.value) return;
    ref.read(assetViewerProvider.notifier).setCurrentIndex(idx);
  }

  void _onPointerDown(PointerDownEvent e) {
    _isPointerDown = true;
  }

  void _onPointerUp(PointerUpEvent e) {
    _isPointerDown = false;
    // If scrubbing, leave _isScrubbing true.
    // The scroll may still be in progress due to inertia.
  }

  void _onPointerCancel(PointerCancelEvent e) {
    _isPointerDown = false;
    _isScrubbing = false;
  }

  void _onScrollingChanged() {
    // Only react to the end of scrolling.
    if (_scrollController.position.isScrollingNotifier.value) return;

    if (_isScrubbing) {
      _isScrubbing = false;
      // Softly snap to the current thumbnail (user might have left the scroll in an intermediate position).
      // Note we could end up here due to exact drag or an inertia fling. But the inertia fling should due
      // to simulation always end at exact centered position, so snapping should be a no-op in that case.
      _scrollToCurrentIndex();
    } else {
      // Re-center on the selected thumbnail if a tap animation was
      // interrupted (e.g. double-tap before the first scroll finished).
      _scrollToCurrentIndex(animated: false);
    }
  }

  void _onScrollPositionChanged() {
    // Scrolling while pointer down means the user started scrubbing through the filmstrip.
    // Othwerise, the scrolling is caused by an animation.
    if (_isPointerDown) {
      // Keep the flag on until the scrolling fully stops (we'll be notified).
      _isScrubbing = true;
    }

    if (_isScrubbing) {
      _onFilmstripDrag();
    }
  }

  void _onFilmstripDrag() {
    if (!_scrollController.hasClients) return;
    final offset = _scrollController.offset;
    final idx = (offset / (_itemExtent + _itemGap))
      .round().clamp(0, _timelineService.totalAssets - 1);
    // The scroll position didn't move enough to change the centered index, ignore.
    if (idx == _currentIndex.value) return;

    // Set internal _currentIndex before updating the one in provider
    // as we don't want the provider listener to trigger a scrollToIndex while dragging.
    _currentIndex.value = idx;
    _ensureLoaded();
    ref.read(assetViewerProvider.notifier).setCurrentIndex(idx);
  }

  Widget _buildItem(int idx) {
    final asset = _timelineService.getAssetSafe(idx);
    return GestureDetector(
      onTap: () => _onTap(idx),
      child: ValueListenableBuilder<int>(
        valueListenable: _currentIndex,
        builder: (context, currentIdx, child) {
          return Padding(
            padding: const EdgeInsets.only(right: _itemGap),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              decoration: BoxDecoration(
                border: idx == currentIdx ? Border.all(color: Colors.white70, width: 2.0) : null,
                borderRadius: BorderRadius.circular(3),
              ),
              child: child,
            ),
          );
        },
        child: ClipRRect(
          borderRadius: BorderRadius.circular(2),
          child: SizedBox(
            width: _itemExtent,
            height: _filmstripHeight,
            child: asset == null
                ? const ColoredBox(color: Colors.black26)
                : Thumbnail.fromAsset(asset: asset, fit: BoxFit.cover, size: Size(_itemExtent, _itemExtent)),
          ),
        ),
      ),
    );
  }

  Widget _buildList(int total) {
    return LayoutBuilder(
      builder: (context, constraints) {
        _visibleCount = (constraints.maxWidth / (_itemExtent + _itemGap)).ceil();
        final sidePadding = constraints.maxWidth / 2 - _itemExtent / 2;
        return ListView.builder(
          controller: _scrollController,
          scrollDirection: Axis.horizontal,
          itemCount: total,
          itemExtent: _itemExtent + _itemGap,
          padding: EdgeInsets.symmetric(horizontal: sidePadding),
          itemBuilder: (context, idx) => _buildItem(idx),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(assetViewerProvider.select((s) => s.currentIndex), _onIndexChanged);

    final newHeight = ref.watch(appSettingsServiceProvider).getSetting<int>(AppSettingsEnum.filmstripHeight).toDouble();
    if (newHeight != _filmstripHeight) {
      _applyHeight(newHeight);
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        _scrollToCurrentIndex(animated: false);
      });
    }

    final total = _timelineService.totalAssets;
    if (total == 0) return const SizedBox.shrink();

    return SizedBox(
      height: _filmstripHeight,
      child: Listener(
        onPointerDown: _onPointerDown,
        onPointerUp: _onPointerUp,
        onPointerCancel: _onPointerCancel,
        child: _buildList(total),
      ),
    );
  }
}
