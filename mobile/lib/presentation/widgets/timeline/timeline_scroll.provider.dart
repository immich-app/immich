import 'dart:async';
import 'dart:collection';
import 'dart:math' as math;

import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/events.model.dart';
import 'package:immich_mobile/domain/models/settings_key.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/presentation/widgets/timeline/segment.model.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.state.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline_drag_region.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';

/// Transient interaction state of the chrome timeline that drives rebuilds of
/// the content slivers + viewport (scale/drag/physics).
class TimelineScrollState {
  final int perRow;
  final double scaleFactor;
  final bool dragging;
  final ScrollPhysics? physics;

  const TimelineScrollState({this.perRow = 4, this.scaleFactor = 3.0, this.dragging = false, this.physics});

  TimelineScrollState copyWith({int? perRow, double? scaleFactor, bool? dragging, ScrollPhysics? physics}) {
    return TimelineScrollState(
      perRow: perRow ?? this.perRow,
      scaleFactor: scaleFactor ?? this.scaleFactor,
      dragging: dragging ?? this.dragging,
      // physics is nullable-by-design; pass explicitly to clear.
      physics: physics,
    );
  }
}

/// Owns the chrome timeline's [ScrollController] and everything bound to it:
/// the iOS status-bar-tap observer, the scroll event subscription, position
/// restore, pinch-to-scale and drag-selection logic.
///
/// This lives in a provider (not a widget [State]) so the shared `PageChrome`
/// can read the controller *before* it builds the scroll view, keeping the
/// timeline's chrome same-frame. Scoped under the timeline's `ProviderScope`
/// (via [timelineServiceProvider]/[timelineArgsProvider]) so each timeline gets
/// its own instance.
class TimelineScrollController extends Notifier<TimelineScrollState> with WidgetsBindingObserver {
  late final ScrollController controller;
  StreamSubscription? _eventSubscription;

  // Drag selection
  TimelineAssetIndex? _dragAnchorIndex;
  final Set<BaseAsset> _draggedAssets = HashSet();

  double _baseScaleFactor = 3.0;
  int? _restoreAssetIndex;

  @override
  TimelineScrollState build() {
    WidgetsBinding.instance.addObserver(this);
    controller = ScrollController(onAttach: _restoreAssetPosition);
    _eventSubscription = EventStream.shared.listen(_onEvent);

    final perRow = ref.read(appConfigProvider.select((config) => config.timeline.tilesPerRow));
    _baseScaleFactor = 7.0 - perRow;

    ref.listen(multiSelectProvider.select((s) => s.isEnabled), _onMultiSelectionToggled);

    // Remember scroll position across width changes (orientation / rail toggle)
    // so it can be restored after the segments regenerate.
    ref.listen(timelineArgsProvider.select((a) => a.maxWidth), (previous, next) {
      if (previous != null && previous != next) {
        final segments = ref.read(timelineSegmentProvider).valueOrNull;
        if (segments != null && controller.hasClients) {
          _restoreAssetIndex = _getCurrentAssetIndex(segments);
        }
      }
    });

    ref.onDispose(() {
      WidgetsBinding.instance.removeObserver(this);
      controller.dispose();
      _eventSubscription?.cancel();
    });

    return TimelineScrollState(perRow: perRow, scaleFactor: _baseScaleFactor);
  }

  // Capture iOS status bar tap
  @override
  void handleStatusBarTap() => scrollToTop();

  void _onEvent(Event event) {
    switch (event) {
      case ScrollToTopEvent():
        scrollToTop();
      case ScrollToDateEvent scrollToDateEvent:
        scrollToDate(scrollToDateEvent.date);
      default:
        break;
    }
  }

  void _restoreAssetPosition(_) {
    if (_restoreAssetIndex == null) {
      return;
    }

    final asyncSegments = ref.read(timelineSegmentProvider);
    asyncSegments.whenData((segments) {
      final targetSegment = segments.lastWhereOrNull((segment) => segment.firstAssetIndex <= _restoreAssetIndex!);
      if (targetSegment != null) {
        final assetIndexInSegment = _restoreAssetIndex! - targetSegment.firstAssetIndex;
        final newColumnCount = ref.read(timelineArgsProvider).columnCount;
        final rowIndexInSegment = (assetIndexInSegment / newColumnCount).floor();
        final targetRowIndex = targetSegment.firstIndex + 1 + rowIndexInSegment;
        final targetOffset = targetSegment.indexToLayoutOffset(targetRowIndex);
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (controller.hasClients) {
            controller.jumpTo(targetOffset.clamp(0.0, controller.position.maxScrollExtent));
          }
        });
      }
    });
    _restoreAssetIndex = null;
  }

  void _onMultiSelectionToggled(_, bool isEnabled) {
    EventStream.shared.emit(MultiSelectToggleEvent(isEnabled));
  }

  int? getCurrentAssetIndex(List<Segment> segments) => _getCurrentAssetIndex(segments);

  int? _getCurrentAssetIndex(List<Segment> segments) {
    final currentOffset = controller.offset.clamp(0.0, controller.position.maxScrollExtent);
    final segment = segments.findByOffset(currentOffset) ?? segments.lastOrNull;
    int? targetAssetIndex;
    if (segment != null) {
      final rowIndex = segment.getMinChildIndexForScrollOffset(currentOffset);
      if (rowIndex > segment.firstIndex) {
        final rowIndexInSegment = rowIndex - (segment.firstIndex + 1);
        final assetsPerRow = ref.read(timelineArgsProvider).columnCount;
        final assetIndexInSegment = rowIndexInSegment * assetsPerRow;
        targetAssetIndex = segment.firstAssetIndex + assetIndexInSegment;
      } else {
        targetAssetIndex = segment.firstAssetIndex;
      }
    }
    return targetAssetIndex;
  }

  void scrollToTop() {
    if (!controller.hasClients) {
      return;
    }

    final timelineState = ref.read(timelineStateProvider.notifier);
    timelineState.setScrubbing(true);
    controller
        .animateTo(0, duration: const Duration(milliseconds: 250), curve: Curves.easeInOut)
        .whenComplete(() => timelineState.setScrubbing(false));
  }

  void scrollToDate(DateTime date) {
    final timelineState = ref.read(timelineStateProvider.notifier);
    final asyncSegments = ref.read(timelineSegmentProvider);
    asyncSegments.whenData((segments) {
      final targetSegment = segments.firstWhereOrNull((segment) {
        if (segment.bucket is TimeBucket) {
          final segmentDate = (segment.bucket as TimeBucket).date;
          return segmentDate.year == date.year && segmentDate.month == date.month && segmentDate.day == date.day;
        }
        return false;
      });

      final fallbackSegment =
          targetSegment ??
          segments.firstWhereOrNull((segment) {
            if (segment.bucket is TimeBucket) {
              final segmentDate = (segment.bucket as TimeBucket).date;
              return segmentDate.year == date.year && segmentDate.month == date.month;
            }
            return false;
          });

      if (fallbackSegment != null) {
        final targetOffset = fallbackSegment.startOffset - 50;
        timelineState.setScrubbing(true);
        controller
            .animateTo(
              targetOffset.clamp(0.0, controller.position.maxScrollExtent),
              duration: const Duration(milliseconds: 500),
              curve: Curves.easeInOut,
            )
            .whenComplete(() => timelineState.setScrubbing(false));
      } else {
        timelineState.setScrubbing(false);
      }
    });
  }

  // Pinch to scale
  void onScaleStart() {
    _baseScaleFactor = state.scaleFactor;
  }

  void onScaleUpdate(double scale, List<Segment> segments) {
    final newScaleFactor = math.max(math.min(5.0, _baseScaleFactor * scale), 1.0);
    final newPerRow = 7 - newScaleFactor.toInt();
    if (newPerRow != state.perRow) {
      _restoreAssetIndex = _getCurrentAssetIndex(segments);
      state = state.copyWith(scaleFactor: newScaleFactor, perRow: newPerRow, physics: state.physics);
      ref.read(settingsProvider).write(SettingsKey.timelineTilesPerRow, newPerRow);
    }
  }

  // Drag selection
  void setDragStartIndex(TimelineAssetIndex index) {
    _dragAnchorIndex = index;
    state = state.copyWith(dragging: true, physics: const ClampingScrollPhysics());
  }

  void stopDrag() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      // Reset physics post frame to prevent a sudden change on iOS.
      state = state.copyWith(dragging: state.dragging, physics: null);
    });
    _draggedAssets.clear();
    state = state.copyWith(dragging: false, physics: state.physics);
    final timelineState = ref.read(timelineStateProvider.notifier);
    Future.delayed(const Duration(milliseconds: 300), () {
      timelineState.setScrolling(false);
    });
  }

  void dragScroll(ScrollDirection direction) {
    controller.animateTo(
      controller.offset + (direction == ScrollDirection.forward ? 175 : -175),
      duration: const Duration(milliseconds: 125),
      curve: Curves.easeOut,
    );
  }

  void onScrollStart() {
    ref.read(timelineStateProvider.notifier).setScrolling(true);
  }

  void handleDragAssetEnter(TimelineAssetIndex index) {
    if (_dragAnchorIndex == null || !state.dragging) {
      return;
    }

    final timelineService = ref.read(timelineServiceProvider);
    final dragAnchorIndex = _dragAnchorIndex!;

    final startIndex = math.min(dragAnchorIndex.assetIndex, index.assetIndex);
    final endIndex = math.max(dragAnchorIndex.assetIndex, index.assetIndex);
    final count = endIndex - startIndex + 1;

    if (timelineService.hasRange(startIndex, count)) {
      final selectedAssets = timelineService.getAssets(startIndex, count);
      final multiSelectNotifier = ref.read(multiSelectProvider.notifier);
      for (final asset in _draggedAssets) {
        multiSelectNotifier.deselectAsset(asset);
      }
      _draggedAssets.clear();
      for (final asset in selectedAssets) {
        multiSelectNotifier.selectAsset(asset);
        _draggedAssets.add(asset);
      }
    }
  }
}

final timelineScrollProvider = NotifierProvider<TimelineScrollController, TimelineScrollState>(
  TimelineScrollController.new,
  dependencies: [timelineServiceProvider, timelineArgsProvider, multiSelectProvider, timelineSegmentProvider],
);
