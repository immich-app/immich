import 'dart:math' as math;

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/setting.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/presentation/widgets/timeline/constants.dart';
import 'package:immich_mobile/presentation/widgets/timeline/fixed/segment_builder.dart';
import 'package:immich_mobile/presentation/widgets/timeline/segment.model.dart';
import 'package:immich_mobile/providers/infrastructure/setting.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/utils/debounce.dart';

class TimelineArgs {
  final double maxWidth;
  final double maxHeight;
  final double spacing;
  final int columnCount;
  final bool? showStorageIndicator;
  final bool withStack;
  final GroupAssetsBy? groupBy;

  const TimelineArgs({
    required this.maxWidth,
    required this.maxHeight,
    this.spacing = kTimelineSpacing,
    this.columnCount = kTimelineColumnCount,
    this.showStorageIndicator,
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
  final DateTime? currentScrubberDate;

  const TimelineState({this.isScrubbing = false, this.isScrolling = false, this.currentScrubberDate});

  bool get isInteracting => isScrubbing || isScrolling;

  @override
  bool operator ==(covariant TimelineState other) {
    return isScrubbing == other.isScrubbing &&
        isScrolling == other.isScrolling &&
        currentScrubberDate == other.currentScrubberDate;
  }

  @override
  int get hashCode => isScrubbing.hashCode ^ isScrolling.hashCode ^ currentScrubberDate.hashCode;

  TimelineState copyWith({bool? isScrubbing, bool? isScrolling, DateTime? currentScrubberDate}) {
    return TimelineState(
      isScrubbing: isScrubbing ?? this.isScrubbing,
      isScrolling: isScrolling ?? this.isScrolling,
      currentScrubberDate: currentScrubberDate ?? this.currentScrubberDate,
    );
  }
}

class TimelineStateNotifier extends Notifier<TimelineState> {
  Debouncer? _scrubberDebouncer;

  void setScrubbing(bool isScrubbing) {
    state = state.copyWith(isScrubbing: isScrubbing);
  }

  void setScrolling(bool isScrolling) {
    state = state.copyWith(isScrolling: isScrolling);
  }

  void onScrubberDateChanged(DateTime date) {
    if (state.currentScrubberDate != date) {
      state = state.copyWith(isScrubbing: true, currentScrubberDate: date);

      _scrubberDebouncer ??= Debouncer(interval: const Duration(milliseconds: 150));

      _scrubberDebouncer!.run(() {
        if (state.currentScrubberDate == date) {
          state = state.copyWith(isScrubbing: false);
        }
      });
    }
  }

  @override
  TimelineState build() => const TimelineState(isScrubbing: false, isScrolling: false);
}

// This provider watches the buckets from the timeline service & args and serves the segments.
// It should be used only after the timeline service and timeline args provider is overridden
final timelineSegmentProvider = StreamProvider.autoDispose<List<Segment>>((ref) async* {
  final args = ref.watch(timelineArgsProvider);
  final columnCount = args.columnCount;
  final spacing = args.spacing;
  final availableTileWidth = args.maxWidth - (spacing * (columnCount - 1));
  final tileExtent = math.max(0, availableTileWidth) / columnCount;

  final groupBy = args.groupBy ?? GroupAssetsBy.values[ref.watch(settingsProvider).get(Setting.groupAssetsBy)];

  final timelineService = ref.watch(timelineServiceProvider);
  yield* timelineService.watchBuckets().map((buckets) {
    return FixedSegmentBuilder(
      buckets: buckets,
      tileHeight: tileExtent,
      columnCount: columnCount,
      spacing: spacing,
      groupBy: groupBy,
    ).generate();
  });
}, dependencies: [timelineServiceProvider, timelineArgsProvider]);

final timelineStateProvider = NotifierProvider<TimelineStateNotifier, TimelineState>(TimelineStateNotifier.new);
