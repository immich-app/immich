import 'dart:async';

import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/presentation/widgets/images/thumbnail.widget.dart';

/// A small, scrollable window into the timeline shown while viewing an asset.
///
/// The selected thumbnail stays centred. During a horizontal drag, the
/// thumbnail nearest the centre is selected, so the viewer follows the scrub.
class FilmstripScrubber extends StatefulWidget {
  static const _thumbnailExtent = 52.0;
  static const _selectorLineOverhang = 6.0;

  /// Total on-screen height of the scrubber, fixed regardless of asset type.
  /// Other viewer chrome (video controls, the OCR toggle, etc.) should shift
  /// up to make room for this rather than the scrubber adapting to them.
  static const double height = _thumbnailExtent + _selectorLineOverhang * 2;

  /// Vertical breathing room to leave above and below the scrubber.
  static const double margin = 12.0;

  final TimelineService timelineService;
  final int currentIndex;
  final int totalAssets;
  final ValueChanged<int> onSelected;

  /// The main viewer's page controller. Its live (fractional) page value is
  /// mirrored 1:1 into this strip's scroll position, so dragging the photo
  /// glides the filmstrip at the same pace instead of only snapping once the
  /// page settles.
  final PageController pageController;

  /// Reports whether the strip is actively being scrubbed, with a short
  /// settle delay after the gesture ends. Lets the viewer defer starting
  /// heavier per-asset work (like a video player) until the scrub calms down.
  final ValueChanged<bool>? onScrubbingChanged;

  /// Decode size used for the main viewer's placeholder thumbnail. Passing
  /// the same size here lets these thumbnails share a cache entry with it,
  /// so scrubbing to an asset already shown here is an instant swap instead
  /// of a fresh decode.
  final Size? thumbnailSize;

  const FilmstripScrubber({
    super.key,
    required this.timelineService,
    required this.currentIndex,
    required this.totalAssets,
    required this.onSelected,
    required this.pageController,
    this.onScrubbingChanged,
    this.thumbnailSize,
  });

  @override
  State<FilmstripScrubber> createState() => _FilmstripScrubberState();
}

class _FilmstripScrubberState extends State<FilmstripScrubber> {
  static const _thumbnailExtent = FilmstripScrubber._thumbnailExtent;
  static const _thumbnailSpacing = 4.0;
  static const _itemExtent = _thumbnailExtent + _thumbnailSpacing;
  // How many assets' metadata (including thumbHash) to cache on each side of
  // wherever the strip is centered. Large on purpose: TimelineService floors
  // every DB fetch at kTimelineAssetLoadBatchSize (1024) regardless of how
  // much we ask for, so asking for a window this size costs no extra query -
  // it's the same fetch, just handing back more of it. What it buys is a big
  // head start on thumbhash decoding in both directions, so a hard fling
  // rarely - if ever - outruns it into a run of blank placeholder cells.
  static const _windowRadius = 150;
  static const _thumbnailBorderRadius = 6.0;
  static const _selectorLineWidth = 2.0;
  static const _selectorLineOverhang = FilmstripScrubber._selectorLineOverhang;

  // Caps how often a scrub tick is allowed to touch the DB (via _prefetchAround)
  // or commit a new asset to the main viewer (via widget.onSelected), which in
  // turn can construct a full AssetPage - including a native video player. The
  // strip's own scroll position is never throttled, only this heavier work, so
  // an aggressive fling still looks perfectly smooth without flooding the
  // shared TimelineService buffer or the main pager with dozens of reloads and
  // page rebuilds per second.
  static const _scrubTickInterval = Duration(milliseconds: 60);

  // How long the strip must sit still after a scrub before it reports
  // "settled" - short enough to feel responsive, long enough that quick,
  // repeated flicks never trigger it in between.
  static const _settleDelay = Duration(milliseconds: 300);

  final _scrollController = ScrollController();
  List<BaseAsset> _assets = [];
  var _firstIndex = 0;
  var _isScrubbing = false;
  var _requestId = 0;
  int? _lastScrubbedIndex;
  DateTime? _lastScrubTick;
  Timer? _settleTimer;

  @override
  void initState() {
    super.initState();
    unawaited(_loadWindow());
    widget.pageController.addListener(_onPageControllerChanged);
  }

  @override
  void didUpdateWidget(FilmstripScrubber oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.currentIndex != widget.currentIndex || oldWidget.totalAssets != widget.totalAssets) {
      unawaited(_loadWindow());
    }
    if (oldWidget.pageController != widget.pageController) {
      oldWidget.pageController.removeListener(_onPageControllerChanged);
      widget.pageController.addListener(_onPageControllerChanged);
    }
  }

  @override
  void dispose() {
    widget.pageController.removeListener(_onPageControllerChanged);
    _settleTimer?.cancel();
    _scrollController.dispose();
    super.dispose();
  }

  /// Mirrors the main viewer's live page position into this strip's scroll
  /// offset, so it glides at the exact pace of the photo drag. Only while the
  /// strip itself isn't being scrubbed directly - that gesture already drives
  /// its own position.
  void _onPageControllerChanged() {
    if (_isScrubbing || !widget.pageController.hasClients || !_scrollController.hasClients) {
      return;
    }
    final page = widget.pageController.page;
    if (page == null) {
      return;
    }
    final target = (page * _itemExtent).clamp(0.0, _scrollController.position.maxScrollExtent);
    _scrollController.jumpTo(target);
    if (_shouldRunScrubTick()) {
      unawaited(_prefetchAround(page.round().clamp(0, widget.totalAssets - 1)));
    }
  }

  /// Waits [_settleDelay] after a scrub ends before reporting "settled", so a
  /// quick follow-up flick never toggles heavier work on and off in between.
  void _scheduleSettled() {
    _settleTimer?.cancel();
    _settleTimer = Timer(_settleDelay, () {
      if (!mounted || _isScrubbing) {
        return;
      }
      widget.onScrubbingChanged?.call(false);
    });
  }

  /// Leading-edge throttle: returns true (and starts a new window) at most
  /// once per [_scrubTickInterval]. The scroll position itself is never
  /// gated by this - only the DB prefetch and asset-commit work that follows.
  bool _shouldRunScrubTick() {
    final now = DateTime.now();
    if (_lastScrubTick != null && now.difference(_lastScrubTick!) < _scrubTickInterval) {
      return false;
    }
    _lastScrubTick = now;
    return true;
  }

  /// Fetches the thumbnail cache window if [center] isn't already covered
  /// with enough margin. Does not touch scroll position - safe to call
  /// mid-scrub to keep the cache ahead of a drag or a fling.
  Future<void> _prefetchAround(int center) async {
    if (widget.totalAssets == 0) {
      return;
    }

    const margin = _windowRadius ~/ 2;
    final coversCenter =
        _assets.isNotEmpty && center >= _firstIndex + margin && center <= _firstIndex + _assets.length - 1 - margin;
    if (coversCenter) {
      return;
    }

    final requestId = ++_requestId;
    final firstIndex = (center - _windowRadius).clamp(0, widget.totalAssets - 1);
    final count = (widget.totalAssets - firstIndex).clamp(0, _windowRadius * 2 + 1);
    final assets = await widget.timelineService.loadAssets(firstIndex, count);
    if (!mounted || requestId != _requestId) {
      return;
    }

    setState(() {
      _firstIndex = firstIndex;
      _assets = assets;
    });
  }

  Future<void> _loadWindow() async {
    await _prefetchAround(widget.currentIndex);
    if (!mounted) {
      return;
    }
    WidgetsBinding.instance.addPostFrameCallback((_) {
      // A new scrub may have started while we were awaiting; don't fight it.
      if (!_isScrubbing) {
        _centerThumbnail(widget.currentIndex);
      }
    });
  }

  BaseAsset? _assetAt(int index) {
    final local = index - _firstIndex;
    if (local < 0 || local >= _assets.length) {
      return null;
    }
    return _assets[local];
  }

  void _centerThumbnail(int index) {
    if (!_scrollController.hasClients) {
      return;
    }
    // The list's own leading padding already centers item 0 at offset 0,
    // so the target offset for a given item is just its content position.
    final target = (index * _itemExtent).clamp(0.0, _scrollController.position.maxScrollExtent);
    _scrollController.jumpTo(target);
  }

  void _selectClosestThumbnail({bool recenterIfSelected = false}) {
    if (!_scrollController.hasClients || widget.totalAssets == 0) {
      return;
    }
    // Inverse of the centering formula above: the item whose center sits at
    // the viewport's center is simply offset / itemExtent (padding cancels out).
    final index = (_scrollController.offset / _itemExtent).round().clamp(0, widget.totalAssets - 1);
    if (index != _lastScrubbedIndex) {
      _lastScrubbedIndex = index;
      widget.onSelected(index);
    } else if (recenterIfSelected) {
      // Recenter on the index we just resolved from the live scroll offset,
      // not widget.currentIndex - the parent updates that prop asynchronously
      // (it awaits an asset load first), so it can still lag behind what we
      // already reported via onSelected, which would otherwise snap the strip
      // back to wherever it was before this scrub started.
      _centerThumbnail(index);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.totalAssets < 2) {
      return const SizedBox.shrink();
    }

    return SizedBox(
      height: _thumbnailExtent + _selectorLineOverhang * 2,
      child: Stack(
        alignment: Alignment.center,
        children: [
          SizedBox(
            height: _thumbnailExtent,
            child: NotificationListener<ScrollStartNotification>(
              onNotification: (notification) {
                _isScrubbing = notification.depth == 0 && notification.dragDetails != null;
                if (_isScrubbing) {
                  _lastScrubbedIndex = widget.currentIndex;
                  _lastScrubTick = null;
                  // A new scrub started before the previous one settled -
                  // stay in "scrubbing" mode rather than flip-flopping.
                  _settleTimer?.cancel();
                  widget.onScrubbingChanged?.call(true);
                }
                return false;
              },
              child: NotificationListener<ScrollUpdateNotification>(
                onNotification: (notification) {
                  // The list keeps scrolling at full, uncapped speed regardless -
                  // this only gates the expensive follow-up work below.
                  if (_isScrubbing && notification.depth == 0 && _shouldRunScrubTick()) {
                    final visibleIndex = (_scrollController.offset / _itemExtent).round().clamp(
                      0,
                      widget.totalAssets - 1,
                    );
                    unawaited(_prefetchAround(visibleIndex));
                    _selectClosestThumbnail();
                  }
                  return false;
                },
                child: NotificationListener<ScrollEndNotification>(
                  onNotification: (notification) {
                    if (_isScrubbing && notification.depth == 0) {
                      _isScrubbing = false;
                      // The gesture is over - always resolve the true final
                      // position, bypassing the throttle above.
                      final finalIndex = (_scrollController.offset / _itemExtent).round().clamp(
                        0,
                        widget.totalAssets - 1,
                      );
                      unawaited(_prefetchAround(finalIndex));
                      _selectClosestThumbnail(recenterIfSelected: true);
                      _scheduleSettled();
                    }
                    return false;
                  },
                  child: ListView.builder(
                    controller: _scrollController,
                    scrollDirection: Axis.horizontal,
                    padding: EdgeInsets.symmetric(
                      horizontal: MediaQuery.sizeOf(context).width / 2 - _thumbnailExtent / 2,
                    ),
                    itemCount: widget.totalAssets,
                    itemExtent: _itemExtent,
                    itemBuilder: (context, index) {
                      final isSelected = index == widget.currentIndex;
                      final borderWidth = isSelected ? 2.0 : 1.0;
                      return Padding(
                        padding: const EdgeInsets.only(right: _thumbnailSpacing),
                        child: GestureDetector(
                          onTap: () => widget.onSelected(index),
                          child: AnimatedContainer(
                            duration: Durations.short1,
                            width: _thumbnailExtent,
                            height: _thumbnailExtent,
                            // Insets the thumbnail off the border's own stroke -
                            // without this, the (opaque) thumbnail paints right
                            // over the border, which is drawn as this box's
                            // background, covering nearly all of it.
                            padding: EdgeInsets.all(borderWidth),
                            decoration: BoxDecoration(
                              border: Border.all(color: isSelected ? Colors.white : Colors.white54, width: borderWidth),
                              borderRadius: const BorderRadius.all(Radius.circular(_thumbnailBorderRadius)),
                            ),
                            clipBehavior: Clip.antiAlias,
                            child: ClipRRect(
                              // A smaller radius nested inside the border's own,
                              // reduced by the same inset above, so the
                              // thumbnail's own corners curve concentrically
                              // with the border instead of squaring off inside
                              // its rounded corners.
                              borderRadius: BorderRadius.circular(_thumbnailBorderRadius - borderWidth),
                              child: Thumbnail.fromAsset(
                                asset: _assetAt(index),
                                size: const Size(_thumbnailExtent, _thumbnailExtent),
                                remoteSize: widget.thumbnailSize,
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ),
            ),
          ),
          IgnorePointer(
            child: Container(
              width: _selectorLineWidth,
              height: _thumbnailExtent + _selectorLineOverhang * 2,
              decoration: BoxDecoration(
                // Hardcoded white, matching the thumbnail borders above -
                // like the rest of this viewer's chrome, it always sits on a
                // black backdrop regardless of the app's theme, so there's
                // nothing to adapt to here.
                color: Colors.white,
                borderRadius: BorderRadius.circular(_selectorLineWidth / 2),
                // A soft dark halo, same idea as the play icon on stacked
                // assets (asset_stack.widget.dart) - keeps the line visible
                // if it lands over a bright/white patch of a tall image,
                // without needing anything heavier than the rest of the
                // viewer's chrome uses.
                boxShadow: const [BoxShadow(color: Colors.black54, blurRadius: 4)],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
