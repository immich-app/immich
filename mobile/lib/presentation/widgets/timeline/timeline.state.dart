import 'dart:math' as math;

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/presentation/widgets/timeline/constants.dart';
import 'package:immich_mobile/presentation/widgets/timeline/fixed/segment_builder.dart';
import 'package:immich_mobile/presentation/widgets/timeline/segment.model.dart';
import 'package:immich_mobile/providers/infrastructure/metadata.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';

class TimelineArgs {
  final double maxWidth;
  final double maxHeight;
  final double spacing;
  final int columnCount;
  final bool showStorageIndicator;
  final bool withStack;
  final GroupAssetsBy? groupBy;

  const TimelineArgs({
    required this.maxWidth,
    required this.maxHeight,
    this.spacing = kTimelineSpacing,
    this.columnCount = kTimelineColumnCount,
    this.showStorageIndicator = false,
    this.withStack = false,
    this.groupBy,
  });

  @override
  bool operator ==(covariant TimelineArgs other) {
    return spacing == other.spacing &&
        maxWidth == other.maxWidth &&
        maxHeight == other.maxHeight &&
        columnCount == other.columnCount &&
        showStorageIndicator == other.showStorageIndicator &&
        withStack == other.withStack &&
        groupBy == other.groupBy;
  }

  @override
  int get hashCode =>
      maxWidth.hashCode ^
      maxHeight.hashCode ^
      spacing.hashCode ^
      columnCount.hashCode ^
      showStorageIndicator.hashCode ^
      withStack.hashCode ^
      groupBy.hashCode;
}

class TimelineState {
  final bool isScrubbing;
  final bool isScrolling;
  final bool isPinching;

  const TimelineState({this.isScrubbing = false, this.isScrolling = false, this.isPinching = false});

  bool get isInteracting => isScrubbing || isScrolling;

  @override
  bool operator ==(covariant TimelineState other) {
    return isScrubbing == other.isScrubbing && isScrolling == other.isScrolling && isPinching == other.isPinching;
  }

  @override
  int get hashCode => isScrubbing.hashCode ^ isScrolling.hashCode ^ isPinching.hashCode;

  TimelineState copyWith({bool? isScrubbing, bool? isScrolling, bool? isPinching}) {
    return TimelineState(
      isScrubbing: isScrubbing ?? this.isScrubbing,
      isScrolling: isScrolling ?? this.isScrolling,
      isPinching: isPinching ?? this.isPinching,
    );
  }
}

class TimelineStateNotifier extends Notifier<TimelineState> {
  void setScrubbing(bool isScrubbing) {
    state = state.copyWith(isScrubbing: isScrubbing);
  }

  void setScrolling(bool isScrolling) {
    state = state.copyWith(isScrolling: isScrolling);
  }

  void setPinching(bool isPinching) {
    state = state.copyWith(isPinching: isPinching);
  }

  @override
  TimelineState build() => const TimelineState(isScrubbing: false, isScrolling: false, isPinching: false);
}

/// Session-only column count override set by the pinch-zoom gesture. Persists for
/// the current session but is not written to metadata, so the next app launch falls
/// back to the user's slider preference instead of inheriting the last pinch state.
final pinchZoomColumnsProvider = StateProvider<int?>((_) => null);

/// True when the timeline uses the continuous header-less layout. Two opt-in
/// triggers — both require an explicit user action, so existing day/month/auto
/// users never see this layout unless they choose it:
///   1. User picked "No grouping" in settings (groupBy == none), OR
///   2. User pinched out past [kTimelineGroupedMaxColumnCount] (the manual
///      slider is capped at this value, so reaching the wide range is a
///      deliberate gesture rather than a silent preference change).
bool isContinuousTimelineLayout(int columnCount, GroupAssetsBy groupBy) =>
    groupBy == GroupAssetsBy.none || columnCount > kTimelineGroupedMaxColumnCount;

// This provider watches the buckets from the timeline service & args and serves the segments.
// It should be used only after the timeline service and timeline args provider is overridden
final timelineSegmentProvider = StreamProvider.autoDispose<List<Segment>>((ref) async* {
  final args = ref.watch(timelineArgsProvider);
  final columnCount = args.columnCount;
  // Drop the inter-tile spacing at the widest zoom-out levels (15/32) for a
  // seamless, borderless grid.
  final spacing = columnCount >= kTimelineMonthLabelMaxColumns ? 0.0 : args.spacing;
  final availableTileWidth = args.maxWidth - (spacing * (columnCount - 1));
  final tileExtent = math.max(0, availableTileWidth) / columnCount;

  final groupBy = args.groupBy ?? ref.watch(appConfigProvider.select((config) => config.timeline.groupAssetsBy));

  final timelineService = ref.watch(timelineServiceProvider);
  yield* timelineService.watchBuckets().map((buckets) {
    return FixedSegmentBuilder(
      buckets: buckets,
      tileHeight: tileExtent,
      columnCount: columnCount,
      spacing: spacing,
      groupBy: groupBy!,
    ).generate();
  });
}, dependencies: [timelineServiceProvider, timelineArgsProvider]);

final timelineStateProvider = NotifierProvider<TimelineStateNotifier, TimelineState>(TimelineStateNotifier.new);
