import 'dart:math' as math;

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/presentation/widgets/timeline/constants.dart';
import 'package:immich_mobile/presentation/widgets/timeline/fixed/segment_builder.dart';
import 'package:immich_mobile/presentation/widgets/timeline/segment.model.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
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
  final bool isScrolling;

  /// Indicates whether the timeline is scrolling beyond some configured "high" speed,
  /// such as when programmatically scrolling to the top or a really fast user fling
  final bool recommendDeferredLoading;

  const TimelineState({this.isScrolling = false, this.recommendDeferredLoading = false});

  bool get isInteracting => isScrolling || recommendDeferredLoading;

  @override
  bool operator ==(covariant TimelineState other) {
    return isScrolling == other.isScrolling && recommendDeferredLoading == other.recommendDeferredLoading;
  }

  @override
  int get hashCode => isScrolling.hashCode ^ recommendDeferredLoading.hashCode;

  TimelineState copyWith({bool? isScrolling, bool? recommendDeferredLoading}) {
    return TimelineState(
      isScrolling: isScrolling ?? this.isScrolling,
      recommendDeferredLoading: recommendDeferredLoading ?? this.recommendDeferredLoading,
    );
  }
}

class TimelineStateNotifier extends Notifier<TimelineState> {
  void setScrolling(bool isScrolling) {
    state = state.copyWith(isScrolling: isScrolling);
  }

  void setRecommendDeferredLoading(bool recommendDeferredLoading) {
    state = state.copyWith(recommendDeferredLoading: recommendDeferredLoading);
  }

  @override
  TimelineState build() => const TimelineState(isScrolling: false, recommendDeferredLoading: false);
}

// This provider watches the buckets from the timeline service & args and serves the segments.
// It should be used only after the timeline service and timeline args provider is overridden
final timelineSegmentProvider = StreamProvider.autoDispose<List<Segment>>((ref) async* {
  final args = ref.watch(timelineArgsProvider);
  final columnCount = args.columnCount;
  final spacing = args.spacing;
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
