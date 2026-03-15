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
  /// Should only update the page position — NOT trigger full asset loading,
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
  static const int _windowSize = 80; // assets loaded around the current index

  // Mutable height, updated from settings; item extent = strip height - 4 (border gap).
  late double _stripHeight;
  late double _itemExtent;

  late final ScrollController _scrollController;
  late TimelineService _timelineService;

  /// Loaded assets in the current window.
  List<BaseAsset?> _assets = [];

  /// The absolute index of _assets[0] in the timeline.
  int _windowStart = 0;

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
    _loadWindow(widget.currentIndex.value);
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

    // Reload window if current index is near the edges.
    final localIdx = idx - _windowStart;
    if (localIdx < 10 || localIdx > _windowSize - 10) {
      _loadWindow(idx);
    } else if (!_userDragging) {
      _scrollToCurrentItem(idx);
    }
  }

  Future<void> _loadWindow(int centerIndex) async {
    if (_loading) return;
    _loading = true;

    final total = _timelineService.totalAssets;
    if (total == 0) {
      _loading = false;
      return;
    }

    final start = (centerIndex - _windowSize ~/ 2).clamp(0, total);
    final count = (_windowSize).clamp(0, total - start);

    final loaded = await _timelineService.loadAssets(start, count);

    if (!mounted) return;

    setState(() {
      _windowStart = start;
      _assets = loaded;
    });

    _loading = false;
    // Use addPostFrameCallback so the ListView is fully laid out before we
    // attempt to scroll (hasClients is false until after the rebuild).
    // Always jump instantly after a window load — animating from a reset
    // position looks like a jarring jump. Only skip if user is dragging.
    if (!_userDragging) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted && !_userDragging) _scrollToCurrentItem(centerIndex, animated: false);
      });
    }
  }

  void _onFilmstripDrag() {
    if (!_scrollController.hasClients) return;
    final offset = _scrollController.offset;
    // With centering padding (viewportWidth/2 - itemExtent/2) on each side,
    // item N is centred in the viewport at scroll offset = N * (itemExtent + itemGap).
    final localIdx = (offset / (_itemExtent + _itemGap))
        .round()
        .clamp(0, _assets.length - 1);
    final absoluteIdx = _windowStart + localIdx;
    final total = _timelineService.totalAssets;
    if (absoluteIdx < 0 || absoluteIdx >= total) return;
    if (absoluteIdx == _lastDragIndex) return;
    _lastDragIndex = absoluteIdx;
    widget.onScrub(absoluteIdx);
  }

  void _scrollToCurrentItem(int absoluteIndex, {bool animated = true}) {
    if (!_scrollController.hasClients) return;
    final localIdx = absoluteIndex - _windowStart;
    if (localIdx < 0 || localIdx >= _assets.length) return;

    // With centering padding, item N centres at offset = N * (itemExtent + itemGap).
    final targetOffset = localIdx.toDouble() * (_itemExtent + _itemGap);

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

  @override
  Widget build(BuildContext context) {
    // Keep watching so we rebuild when the asset changes (e.g. after stack change).
    ref.watch(assetViewerProvider.select((s) => s.currentAsset?.heroTag));

    // React to height setting changes (e.g. user changes it in settings while viewer is open).
    final newHeight = ref.watch(appSettingsServiceProvider).getSetting<int>(AppSettingsEnum.filmstripHeight).toDouble();
    if (newHeight != _stripHeight) {
      _applyHeight(newHeight);
      // Re-centre the current thumbnail after layout with the new item size.
      WidgetsBinding.instance.addPostFrameCallback(
        (_) { if (mounted) _scrollToCurrentItem(widget.currentIndex.value); },
      );
    }

    return SizedBox(
      height: _stripHeight,
      child: _assets.isEmpty
          ? const SizedBox.shrink()
          : ListenableBuilder(
              listenable: widget.currentIndex,
              builder: (context, _) {
                final currentIdx = widget.currentIndex.value;
                return NotificationListener<ScrollNotification>(
                  onNotification: (notification) {
                    if (notification is ScrollStartNotification &&
                        notification.dragDetails != null) {
                      _userDragging = true;
                      _lastDragIndex = -1;
                    } else if (notification is ScrollUpdateNotification) {
                      // Guard with _userDragging so programmatic animateTo
                      // calls (e.g. _scrollToCurrentItem) don't trigger
                      // onScrub and cause cascading index jumps.
                      // _userDragging stays true through momentum after a
                      // fling, so fast swipes still update the photo.
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
                  },
                  child: LayoutBuilder(
                  builder: (context, constraints) {
                    final sidePadding = constraints.maxWidth / 2 - _itemExtent / 2;
                    return ListView.builder(
                  controller: _scrollController,
                  scrollDirection: Axis.horizontal,
                  itemCount: _assets.length,
                  itemExtent: _itemExtent + _itemGap,
                  padding: EdgeInsets.symmetric(horizontal: sidePadding),
                  itemBuilder: (context, localIdx) {
                    final absoluteIdx = _windowStart + localIdx;
                    final asset = _assets[localIdx];
                    final isSelected = absoluteIdx == currentIdx;

                    return GestureDetector(
                      onTap: () => widget.onTap(absoluteIdx),
                      child: Padding(
                        padding: const EdgeInsets.only(right: _itemGap),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 150),
                          decoration: BoxDecoration(
                            border: isSelected
                                ? Border.all(color: Colors.white, width: 2.0)
                                : null,
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
                  },
                  );
                  },
                ),
                );
              },
            ),
    );
  }
}
