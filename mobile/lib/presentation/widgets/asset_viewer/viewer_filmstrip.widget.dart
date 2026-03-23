import 'package:flutter/gestures.dart';
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
  static const int _bufferWindow = 100;

  late double _filmstripHeight;
  late double _itemExtent;

  late final ScrollController _scrollController;
  late TimelineService _timelineService;

  bool _loading = false;
  late final ValueNotifier<int> _currentIndex;
  bool _isScrubbing = false;
  Offset? _pointerDownPosition;

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
    _ensureBuffered(initialIndex);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
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

  /// Ensures the assets around [idx] are loaded.
  Future<void> _ensureBuffered(int idx) async {
    if (_loading) return; // TODO: consider cancelling in-flight load and starting new one?

    final total = _timelineService.totalAssets;
    // TODO: Might want to check if _bufferWindow is not more than what cache can hold.
    final half = _bufferWindow ~/ 2;
    final start = (idx - half).clamp(0, total - 1);
    final count = _bufferWindow.clamp(0, total - start);
    if (_timelineService.hasRange(start, count)) return;

    _loading = true;
    await _timelineService.loadAssets(start, count);
    _loading = false;

    // We use placeholders for assets that are not cached in timeline when building filmstrip item.
    // This will update the thumbnails once the assets are actually loaded.
    if (mounted) setState(() {});
  }

  /// Called when the provider's currentIndex changes.
  /// The reaction to taps is also routed through this listener.
  void _onIndexChanged(int? _, int idx) {
    if (idx == _currentIndex.value) return;
    _currentIndex.value = idx;

    _ensureBuffered(idx);
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
    _pointerDownPosition = e.position;
  }

  void _onPointerMove(PointerMoveEvent e) {
    if (_isScrubbing || _pointerDownPosition == null) return;
    if ((e.position.dx - _pointerDownPosition!.dx).abs() > kTouchSlop) {
      _isScrubbing = true;
    }
  }

  void _onPointerUp(PointerUpEvent e) {
    _pointerDownPosition = null;
    // If scrubbing, leave _isScrubbing true.
    // The scroll may still be in progress due to inertia.
    // Once finished _onScrollingChanged (`isScrollingNotifier` listener) will set the flag.
  }

  void _onPointerCancel(PointerCancelEvent e) {
    _pointerDownPosition = null;
    _isScrubbing = false;
  }

  // TODO: Use ScrollEndNotification?
  void _onScrollingChanged() {
    // Only react to the end of scrolling.
    if (_scrollController.position.isScrollingNotifier.value) return;

    if (_isScrubbing) {
      _isScrubbing = false;
      // TODO: Softly snap to the centered thumbnail (user might have left the scroll in an intermediate position).
      // Note we could end up here due to exact drag or anm inertia fling.
      // But the inertia fling should due to simulation always end at exact centered position, so snapping should be a no-op in that case.
      _scrollToCurrentIndex(); // Test the soft snap by simply using animation
    } else {
      // Re-center on the selected thumbnail if a tap animation was
      // interrupted (e.g. double-tap before the first scroll finished).
      _scrollToCurrentIndex(animated: false);
    }
  }

  void _onScrollPositionChanged() {
    // The event might be due to user dragging or programmatic animation.
    // Differentiate and only trigger scrubbing if it's a user drag.
    if (_isScrubbing) {
      _onFilmstripDrag();
    }
  }

  void _onFilmstripDrag() {
    if (!_scrollController.hasClients) return;
    final offset = _scrollController.offset;
    final idx = (offset / (_itemExtent + _itemGap))
        .round()
        .clamp(0, _timelineService.totalAssets - 1);
    // The scroll position didn't move enough to change the centered index, ignore.
    if (idx == _currentIndex.value) return;

    // Set internal _currentIndex before updating the one in provider
    // as we don't want the provider listener to trigger a scrollToIndex while dragging.
    _currentIndex.value = idx;
    _ensureBuffered(idx);
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
    ref.listen(
      assetViewerProvider.select((s) => s.currentIndex),
      _onIndexChanged,
    );

    final newHeight = ref.watch(appSettingsServiceProvider).getSetting<int>(AppSettingsEnum.filmstripHeight).toDouble();
    if (newHeight != _filmstripHeight) {
      _applyHeight(newHeight);
      WidgetsBinding.instance.addPostFrameCallback(
        (_) {
        if (mounted) _scrollToCurrentIndex();
      },
      );
    }

    final total = _timelineService.totalAssets;
    if (total == 0) return const SizedBox.shrink();

    return SizedBox(
      height: _filmstripHeight,
      child: Listener(
        onPointerDown: _onPointerDown,
        onPointerMove: _onPointerMove,
        onPointerUp: _onPointerUp,
        onPointerCancel: _onPointerCancel,
        child: _buildList(total),
      ),
    );
  }
}
