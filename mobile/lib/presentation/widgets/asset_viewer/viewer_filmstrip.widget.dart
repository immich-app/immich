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
///
/// Two independent interaction flows:
///
/// Tapping a thumbnail -> [currentIndex] changes -> filmstrip animates to centre on that item.
///
/// Dragging the filmstrip -> pointer event handlers recognize the drag ->
/// [_onScrollPositionChanged] fires 
class ViewerFilmstrip extends ConsumerStatefulWidget {
  /// Action to perform when the user taps a thumbnail.
  final void Function(int index) onTap;
  /// Action to perform when the user scrubs the filmstrip (drags to a different index).
  final void Function(int index) onScrub;
  /// The index of the currently displayed asset. 
  final ValueNotifier<int> currentIndex;

  const ViewerFilmstrip({
    super.key,
    required this.onTap,
    required this.onScrub,
    required this.currentIndex,
  });

  @override
  ConsumerState<ViewerFilmstrip> createState() => _ViewerFilmstripState();
}

class _ViewerFilmstripState extends ConsumerState<ViewerFilmstrip> {
  static const double _itemGap = 2.0;
  static const int _bufferWindow = 100;

  late double _stripHeight;
  late double _itemExtent;

  late final ScrollController _scrollController;
  late TimelineService _timelineService;

  bool _loading = false;
  int _previousIndex = -1;
  bool _isDragging = false;
  Offset? _pointerDownPosition;

  void _applyHeight(double height) {
    _stripHeight = height;
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
    widget.currentIndex.addListener(_onIndexChanged);
    _ensureBuffered(widget.currentIndex.value);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _scrollToCurrentIndex(animated: false);
      _scrollController.position.isScrollingNotifier.addListener(_onScrollingChanged);
    });
  }

  @override
  void dispose() {
    widget.currentIndex.removeListener(_onIndexChanged);
    if (_scrollController.hasClients) {
      _scrollController.position.isScrollingNotifier.removeListener(_onScrollingChanged);
    }
    _scrollController.removeListener(_onScrollPositionChanged);
    _scrollController.dispose();
    super.dispose();
  }

  /// Ensures the asset at [idx] and a buffer of assets around it are loaded.
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
    if (mounted) setState(() {});
  }

  /// Called when the index of the currently displayed asset changes.
  void _onIndexChanged() {
    final idx = widget.currentIndex.value;
    if (idx == _previousIndex) return;
    _previousIndex = idx;

    if (_isDragging) return;

    _ensureBuffered(idx);
    _scrollToCurrentIndex();
  }

  /// Updates the scroll position to center on the current index. 
  void _scrollToCurrentIndex({bool animated = true}) {
    if (!_scrollController.hasClients) return;
    final index = widget.currentIndex.value;
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

  void _onPointerDown(PointerDownEvent e) {
    _pointerDownPosition = e.position;
  }

  void _onPointerMove(PointerMoveEvent e) {
    if (_isDragging || _pointerDownPosition == null) return;
    if ((e.position.dx - _pointerDownPosition!.dx).abs() > kTouchSlop) {
      _isDragging = true;
    }
  }

  void _onPointerUp(PointerUpEvent e) {
    _pointerDownPosition = null;
    // If dragging, leave _isDragging true.
    // The scroll may still be in progress due to inertia.
    // Once finished _onScrollingChanged (`isScrollingNotifier` listener) will set the flag.
  }

  void _onPointerCancel(PointerCancelEvent e) {
    _pointerDownPosition = null;
    _isDragging = false;
  }

  void _onScrollingChanged() {
    if (!_scrollController.position.isScrollingNotifier.value) {
      // Scrolling stopped, consider potential drag finished.
      _isDragging = false;
    }
  }

  void _onScrollPositionChanged() {
    // The event might be due to user dragging or programmatic animation.
    // Differentiate and only trigger scrubbing if it's a user drag.
    if (_isDragging) {
      _onFilmstripDrag();
    }
  }

  void _onFilmstripDrag() {
    if (!_scrollController.hasClients) return;
    final offset = _scrollController.offset;
    final idx = (offset / (_itemExtent + _itemGap))
        .round()
        .clamp(0, _timelineService.totalAssets - 1);
    if (idx == widget.currentIndex.value) return;

    _ensureBuffered(idx);
    widget.onScrub(idx);
  }

  Widget _buildItem(int idx, int currentIdx) {
    final asset = _timelineService.getAssetSafe(idx);
    final isSelected = idx == currentIdx;
    return GestureDetector(
      onTap: () => widget.onTap(idx),
      child: Padding(
        padding: const EdgeInsets.only(right: _itemGap),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          decoration: BoxDecoration(
            border: isSelected ? Border.all(color: Colors.white, width: 2.0) : null,
            borderRadius: BorderRadius.circular(3),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(2),
            child: SizedBox(
              width: _itemExtent,
              height: _stripHeight,
              child: asset == null
                  ? const ColoredBox(color: Colors.black26)
                  : Thumbnail.fromAsset(
                      asset: asset,
                      fit: BoxFit.cover,
                      size: Size(_itemExtent, _itemExtent),
                    ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildList(int currentIdx, int total) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final sidePadding = constraints.maxWidth / 2 - _itemExtent / 2;
        return ListView.builder(
          controller: _scrollController,
          scrollDirection: Axis.horizontal,
          itemCount: total,
          itemExtent: _itemExtent + _itemGap,
          padding: EdgeInsets.symmetric(horizontal: sidePadding),
          itemBuilder: (context, idx) => _buildItem(idx, currentIdx),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    ref.watch(assetViewerProvider.select((s) => s.currentAsset?.heroTag));

    final newHeight = ref.watch(appSettingsServiceProvider).getSetting<int>(AppSettingsEnum.filmstripHeight).toDouble();
    if (newHeight != _stripHeight) {
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
      height: _stripHeight,
      child: Listener(
        onPointerDown: _onPointerDown,
        onPointerMove: _onPointerMove,
        onPointerUp: _onPointerUp,
        onPointerCancel: _onPointerCancel,
        child: ListenableBuilder(
          listenable: widget.currentIndex,
          builder: (context, _) => _buildList(widget.currentIndex.value, total),
        ),
      ),
    );
  }
}
