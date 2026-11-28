import 'dart:async';
import 'dart:math';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/events.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/viewer_filmstrip_item.widget.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/viewer_filmstrip_physics.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/haptic_feedback.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';

class ViewerFilmstrip extends ConsumerStatefulWidget {
  final Widget? actions;

  const ViewerFilmstrip({super.key, this.actions});

  @override
  ConsumerState<ViewerFilmstrip> createState() => _FilmstripState();
}

enum _StripDriver { none, user, swipe }

class _FilmstripState extends ConsumerState<ViewerFilmstrip> with SingleTickerProviderStateMixin {
  static const _recenterDuration = Durations.short4;
  static const _collapseDuration = Durations.short2;
  static const _expandDuration = Durations.medium1;

  late final _physics = SnapToItemPhysics(
    itemSlot: FilmstripMetrics.itemSlot,
    isSnapping: () => _driver != _StripDriver.swipe,
  );
  late final TimelineService _timelineService = ref.read(timelineServiceProvider);
  late int _currentIndex = ref.read(assetViewerProvider).currentIndex;
  late final _scrollController = ScrollController(initialScrollOffset: _currentIndex * FilmstripMetrics.itemSlot);
  late final _expansion = AnimationController(vsync: this, value: 1);
  late final _focus = ValueNotifier<double>(_currentIndex.toDouble());
  final _actionsShown = ValueNotifier(true);
  late final _swipePage = ref.read(viewerSwipePageProvider);
  StreamSubscription<TimelineReloadEvent>? _reloadSubscription;

  int _visibleCount = 0;
  Future<void>? _loadTask;
  bool _isLoadTaskAwaited = false;
  _StripDriver _driver = _StripDriver.none;
  int _pointersDown = 0;
  bool _userScrollJustEnded = false;
  bool _touchCaughtUserScroll = false;

  @override
  void initState() {
    super.initState();
    _swipePage.addListener(_onSwipePage);
    _reloadSubscription = EventStream.shared.listen<TimelineReloadEvent>(_onTimelineReload);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        unawaited(_ensureLoaded());
      }
    });
  }

  @override
  void dispose() {
    _swipePage.removeListener(_onSwipePage);
    unawaited(_reloadSubscription?.cancel());
    _scrollController.dispose();
    _expansion.dispose();
    _focus.dispose();
    _actionsShown.dispose();
    super.dispose();
  }

  void _onTimelineReload(TimelineReloadEvent _) {
    if (!mounted) {
      return;
    }
    setState(() {});
    unawaited(_ensureLoaded());
  }

  ({int start, int count}) _windowAround(int index, int size) {
    final start = max(index - size ~/ 2, 0);
    return (start: start, count: min(size, _timelineService.totalAssets - start));
  }

  Future<void> _ensureLoaded() async {
    if (_visibleCount == 0) {
      return;
    }

    if (_loadTask != null) {
      if (_isLoadTaskAwaited) {
        return;
      }
      _isLoadTaskAwaited = true;
      try {
        await _loadTask;
      } finally {
        _isLoadTaskAwaited = false;
      }
    }

    final shown = _windowAround(_currentIndex, _visibleCount * 3);
    if (_timelineService.hasRange(shown.start, shown.count)) {
      return;
    }

    final buffer = _windowAround(_currentIndex, _visibleCount * 10);
    _loadTask = _timelineService.loadAssets(buffer.start, buffer.count).catchError((_) => <BaseAsset>[]).whenComplete(
      () {
        if (mounted) {
          setState(() {});
        }
        _loadTask = null;
      },
    );
  }

  void _onViewportWidth(double width) {
    _visibleCount = (width / FilmstripMetrics.itemSlot).ceil();
  }

  int _centeredIndex(double offset) =>
      (offset / FilmstripMetrics.itemSlot).round().clamp(0, _timelineService.totalAssets - 1);

  void _onIndexChanged(int? _, int index) {
    if (index == _currentIndex) {
      return;
    }
    final distance = (index - _currentIndex).abs();
    _currentIndex = index;
    unawaited(_ensureLoaded());
    if (_driver != _StripDriver.swipe) {
      _scrollToCurrentIndex(animated: distance <= _visibleCount);
    }
  }

  void _onSwipePage() {
    final page = _swipePage.value;
    if (page == null) {
      if (_driver == _StripDriver.swipe) {
        _driver = _StripDriver.none;
        _scrollToCurrentIndex(animated: true);
      }
      return;
    }
    if (_pointersDown > 0 || _driver == _StripDriver.user || !_scrollController.hasClients) {
      return;
    }
    if (_driver != _StripDriver.swipe) {
      _driver = _StripDriver.swipe;
      _expand();
    }
    _focus.value = page;
    final position = _scrollController.position;
    _scrollController.jumpTo(
      (page * FilmstripMetrics.itemSlot).clamp(position.minScrollExtent, position.maxScrollExtent),
    );
  }

  void _onPointerDown(PointerDownEvent _) {
    if (_pointersDown++ == 0) {
      _touchCaughtUserScroll = _userScrollJustEnded;
    }
  }

  void _onPointerUp(PointerEvent _) {
    _pointersDown = max(_pointersDown - 1, 0);
    if (_pointersDown == 0) {
      _recenterWhenIdle();
    }
  }

  void _recenterWhenIdle() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted &&
          _pointersDown == 0 &&
          _driver != _StripDriver.swipe &&
          _scrollController.hasClients &&
          !_scrollController.position.isScrollingNotifier.value) {
        _scrollToCurrentIndex(animated: true);
      }
    });
  }

  void _collapse() {
    _actionsShown.value = false;
    unawaited(_expansion.animateTo(0, duration: _collapseDuration, curve: Curves.easeOut));
  }

  void _expand() {
    _focus.value = _currentIndex.toDouble();
    _actionsShown.value = true;
    unawaited(_expansion.animateTo(1, duration: _expandDuration, curve: Curves.easeOutCubic));
  }

  void _scrollToCurrentIndex({required bool animated}) {
    if (!_scrollController.hasClients) {
      return;
    }
    final position = _scrollController.position;
    final target = (_currentIndex * FilmstripMetrics.itemSlot).clamp(
      position.minScrollExtent,
      position.maxScrollExtent,
    );
    final distance = (target - position.pixels).abs();
    if (distance < 1) {
      if (distance > 0) {
        _scrollController.jumpTo(target);
      }
      _expand();
      return;
    }
    if (animated) {
      unawaited(_scrollController.animateTo(target, duration: _recenterDuration, curve: Curves.easeOutCubic));
    } else {
      _scrollController.jumpTo(target);
    }
  }

  void _select(int index) {
    _currentIndex = index;
    ref.read(hapticFeedbackProvider.notifier).selectionClick();
    unawaited(_ensureLoaded());
    ref.read(assetViewerProvider.notifier).setCurrentIndex(index);
  }

  void _onTapUp(TapUpDetails details, double viewportWidth) {
    final leadingPadding = viewportWidth / 2 - FilmstripMetrics.itemExtent / 2;
    final index = FilmstripMetrics.indexAt(
      details.localPosition.dx + _scrollController.offset - leadingPadding,
      total: _timelineService.totalAssets,
      focus: _focus.value,
      expansion: _expansion.value,
    );
    if (index == null || index == _currentIndex || _touchCaughtUserScroll) {
      return;
    }
    _select(index);
    _scrollToCurrentIndex(animated: true);
  }

  bool _onScrollNotification(ScrollNotification notification) {
    if (notification.depth != 0 || _driver == _StripDriver.swipe) {
      return false;
    }

    switch (notification) {
      case ScrollStartNotification(:final dragDetails):
        _driver = dragDetails != null ? _StripDriver.user : _StripDriver.none;
        _collapse();
      case ScrollUpdateNotification(:final dragDetails, :final metrics):
        if (dragDetails != null && _driver != _StripDriver.user) {
          _driver = _StripDriver.user;
          _collapse();
        }
        final index = _centeredIndex(metrics.pixels);
        if (_driver == _StripDriver.user && index != _currentIndex) {
          _select(index);
        }
      case ScrollEndNotification():
        _userScrollJustEnded = _driver == _StripDriver.user;
        _driver = _StripDriver.none;
        scheduleMicrotask(() => _userScrollJustEnded = false);
        _recenterWhenIdle();
      default:
    }
    return false;
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(assetViewerProvider.select((s) => s.currentIndex), _onIndexChanged);
    final remoteSize = ref.watch(assetViewerProvider.select((s) => s.thumbnailSize));

    final hasStrip = _timelineService.totalAssets > 0;
    return Stack(
      children: [
        if (hasStrip)
          Positioned.fill(
            child: _Strip(
              controller: _scrollController,
              physics: _physics,
              itemCount: _timelineService.totalAssets,
              assetAt: _timelineService.getAssetSafe,
              remoteSize: remoteSize,
              focus: _focus,
              expansion: _expansion,
              onViewportWidth: _onViewportWidth,
              onPointerDown: _onPointerDown,
              onPointerUp: _onPointerUp,
              onScrollNotification: _onScrollNotification,
              onTapUp: _onTapUp,
            ),
          ),
        Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (hasStrip) const SizedBox(height: FilmstripMetrics.stripHeight, width: double.infinity),
            if (widget.actions case final actions?)
              _CollapsibleActions(shown: _actionsShown, opacity: _expansion, child: actions),
          ],
        ),
      ],
    );
  }
}

class _Strip extends StatelessWidget {
  final ScrollController controller;
  final ScrollPhysics physics;
  final int itemCount;
  final BaseAsset? Function(int index) assetAt;
  final Size? remoteSize;
  final ValueListenable<double> focus;
  final Animation<double> expansion;
  final ValueChanged<double> onViewportWidth;
  final PointerDownEventListener onPointerDown;
  final ValueChanged<PointerEvent> onPointerUp;
  final NotificationListenerCallback<ScrollNotification> onScrollNotification;
  final void Function(TapUpDetails details, double viewportWidth) onTapUp;

  const _Strip({
    required this.controller,
    required this.physics,
    required this.itemCount,
    required this.assetAt,
    required this.remoteSize,
    required this.focus,
    required this.expansion,
    required this.onViewportWidth,
    required this.onPointerDown,
    required this.onPointerUp,
    required this.onScrollNotification,
    required this.onTapUp,
  });

  static final _placeholderTheme = ThemeData(colorScheme: const ColorScheme.dark(surfaceContainer: Color(0xFF262626)));

  static Shader _edgeFade(Rect bounds) {
    final fade = min(32 / bounds.width, 0.5);
    return LinearGradient(
      colors: const [Colors.transparent, Colors.white, Colors.white, Colors.transparent],
      stops: [0, fade, 1 - fade, 1],
    ).createShader(bounds);
  }

  @override
  Widget build(BuildContext context) {
    return Theme(
      data: _placeholderTheme,
      child: LayoutBuilder(
        builder: (context, constraints) {
          final width = constraints.maxWidth;
          onViewportWidth(width);
          return Listener(
            onPointerDown: onPointerDown,
            onPointerUp: onPointerUp,
            onPointerCancel: onPointerUp,
            child: NotificationListener<ScrollNotification>(
              onNotification: onScrollNotification,
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTapUp: (details) => onTapUp(details, width),
                child: ShaderMask(
                  blendMode: BlendMode.dstIn,
                  shaderCallback: _edgeFade,
                  child: ListView.builder(
                    controller: controller,
                    physics: physics,
                    scrollDirection: Axis.horizontal,
                    itemCount: itemCount,
                    itemExtent: FilmstripMetrics.itemSlot,
                    padding: EdgeInsets.symmetric(horizontal: width / 2 - FilmstripMetrics.itemExtent / 2),
                    itemBuilder: (context, index) => Align(
                      alignment: Alignment.topCenter,
                      child: SizedBox(
                        height: FilmstripMetrics.stripHeight,
                        child: FilmstripItem(
                          asset: assetAt(index),
                          remoteSize: remoteSize,
                          index: index,
                          focus: focus,
                          expansion: expansion,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

class _CollapsibleActions extends StatelessWidget {
  final ValueListenable<bool> shown;
  final Animation<double> opacity;
  final Widget child;

  const _CollapsibleActions({required this.shown, required this.opacity, required this.child});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder(
      valueListenable: shown,
      builder: (_, isShown, child) => IgnorePointer(ignoring: !isShown, child: child),
      child: Listener(
        behavior: HitTestBehavior.opaque,
        child: FadeTransition(opacity: opacity, child: child),
      ),
    );
  }
}
