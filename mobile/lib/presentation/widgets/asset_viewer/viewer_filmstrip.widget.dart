import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/presentation/widgets/images/thumbnail.widget.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';

/// Horizontal filmstrip of asset thumbnails shown at the bottom of the viewer.
///
/// Tap a thumbnail → jump to that asset.
/// Swipe/drag the filmstrip → scroll through nearby thumbnails.
///
/// Height is controlled by [AppSettingsEnum.filmstripHeight]. Thumbnails are
/// square, so a taller strip means larger thumbnails, fewer visible at once,
/// and more finger movement required to reach the next one.
class ViewerFilmstrip extends ConsumerStatefulWidget {
  /// Called with the absolute asset index when the user taps a thumbnail,
  /// or when a drag gesture ends (to commit the final position).
  final void Function(int index) onTap;

  /// Called on every frame during a drag while the index changes.
  /// Should only update the page position, NOT trigger full asset loading,
  /// since doing so mid-drag causes video controls to hide the filmstrip.
  final void Function(int index) onScrub;

  /// The current page index displayed in the main viewer.
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

  late double _stripHeight;
  late double _itemExtent;

  late final ScrollController _scrollController;
  late TimelineService _timelineService;

  bool _loading = false;
  int _previousIndex = -1;
  bool _userDragging = false;
  int _lastDragIndex = -1;

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
    _timelineService = ref.read(timelineServiceProvider);
    widget.currentIndex.addListener(_onIndexChanged);
    _ensureBuffered(widget.currentIndex.value);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _scrollToCurrentItem(widget.currentIndex.value, animated: false);
    });
  }

  @override
  void dispose() {
    widget.currentIndex.removeListener(_onIndexChanged);
    _scrollController.dispose();
    super.dispose();
  }

  void _onIndexChanged() {
    final idx = widget.currentIndex.value;
    if (idx == _previousIndex) return;
    _previousIndex = idx;

    if (_userDragging) return;

    _scrollToCurrentItem(idx);
    _ensureBuffered(idx);
  }

  /// Triggers a buffer load if [idx] is not already in the TimelineService
  /// buffer. The service loads ~1024 items per DB query, so this is cheap.
  Future<void> _ensureBuffered(int idx) async {
    if (_loading) return;
    if (_timelineService.getAssetSafe(idx) != null) return;
    _loading = true;
    await _timelineService.loadAssets(idx, 1);
    _loading = false;
    if (mounted) setState(() {});
  }

  void _onFilmstripDrag() {
    if (!_scrollController.hasClients) return;
    final offset = _scrollController.offset;
    // With centering padding (viewportWidth/2 - itemExtent/2) on each side,
    // item N is centred in the viewport at scroll offset = N * (itemExtent + itemGap).
    final idx = (offset / (_itemExtent + _itemGap))
        .round()
        .clamp(0, _timelineService.totalAssets - 1);
    if (idx == _lastDragIndex) return;
    final prevIdx = _lastDragIndex;

    _lastDragIndex = idx;
    _ensureBuffered(idx);
    widget.onScrub(idx);

    // Prefetch 100 items ahead in the scroll direction so the SQLite load
    // happens well before the user reaches unbuffered territory.
    // Called after _ensureBuffered(idx) so the current item takes priority.
    if (prevIdx >= 0) {
      final direction = idx > prevIdx ? 1 : -1;
      final prefetchIdx = (idx + direction * 100).clamp(0, _timelineService.totalAssets - 1);
      _ensureBuffered(prefetchIdx);
    }
  }

  void _scrollToCurrentItem(int index, {bool animated = true}) {
    if (!_scrollController.hasClients) return;
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

  /// Handles scroll notifications to track drag state and fire [onScrub]/[onTap].
  bool _onScrollNotification(ScrollNotification notification) {
    if (notification is ScrollStartNotification && notification.dragDetails != null) {
      _userDragging = true;
      _lastDragIndex = -1;
    } else if (notification is ScrollUpdateNotification) {
      // Guard with _userDragging so programmatic animateTo calls don't trigger
      // onScrub and cause cascading index jumps.
      if (_userDragging) _onFilmstripDrag();
    } else if (notification is ScrollEndNotification) {
      if (_userDragging && _lastDragIndex >= 0) {
        // Commit the final position now the drag is done.
        widget.onTap(_lastDragIndex);
      }
      _userDragging = false;
      _lastDragIndex = -1;
    }
    return false;
  }

  /// Builds a single thumbnail item. Shows a grey placeholder if the asset
  /// is not yet in the [TimelineService] buffer.
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

  /// Builds the horizontal [ListView] spanning the full timeline.
  /// Uses [LayoutBuilder] to compute centering padding so the first and last
  /// items can be scrolled to the centre of the viewport.
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
    // Keep watching so we rebuild when the asset changes (e.g. after stack change).
    ref.watch(assetViewerProvider.select((s) => s.currentAsset?.heroTag));

    // React to height setting changes (e.g. user changes it in settings while viewer is open).
    final newHeight = ref.watch(appSettingsServiceProvider).getSetting<int>(AppSettingsEnum.filmstripHeight).toDouble();
    if (newHeight != _stripHeight) {
      _applyHeight(newHeight);
      WidgetsBinding.instance.addPostFrameCallback(
        (_) { if (mounted) _scrollToCurrentItem(widget.currentIndex.value); },
      );
    }

    final total = _timelineService.totalAssets;
    if (total == 0) return const SizedBox.shrink();

    return SizedBox(
      height: _stripHeight,
      child: NotificationListener<ScrollNotification>(
        onNotification: _onScrollNotification,
        child: ListenableBuilder(
          listenable: widget.currentIndex,
          builder: (context, _) => _buildList(widget.currentIndex.value, total),
        ),
      ),
    );
  }
}
