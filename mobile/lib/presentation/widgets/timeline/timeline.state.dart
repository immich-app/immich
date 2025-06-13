import 'dart:math' as math;

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/setting.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/presentation/widgets/timeline/constants.dart';
import 'package:immich_mobile/presentation/widgets/timeline/fixed/segment_builder.dart';
import 'package:immich_mobile/presentation/widgets/timeline/segment.model.dart';
import 'package:immich_mobile/providers/infrastructure/setting.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';

class TimelineArgs {
  final double maxWidth;
  final double maxHeight;
  final double spacing;
  final int columnCount;

  const TimelineArgs({
    required this.maxWidth,
    required this.maxHeight,
    this.spacing = kTimelineSpacing,
    this.columnCount = kTimelineColumnCount,
  });

  @override
  bool operator ==(covariant TimelineArgs other) {
    return spacing == other.spacing &&
        maxWidth == other.maxWidth &&
        maxHeight == other.maxHeight &&
        columnCount == other.columnCount;
  }

  @override
  int get hashCode =>
      maxWidth.hashCode ^
      maxHeight.hashCode ^
      spacing.hashCode ^
      columnCount.hashCode;
}

class TimelineState {
  final bool isScrubbing;

  const TimelineState({this.isScrubbing = false});

  @override
  bool operator ==(covariant TimelineState other) {
    return isScrubbing == other.isScrubbing;
  }

  @override
  int get hashCode => isScrubbing.hashCode;

  TimelineState copyWith({bool? isScrubbing}) {
    return TimelineState(isScrubbing: isScrubbing ?? this.isScrubbing);
  }
}

class TimelineStateNotifier extends Notifier<TimelineState> {
  TimelineStateNotifier();

  void setScrubbing(bool isScrubbing) {
    state = state.copyWith(isScrubbing: isScrubbing);
  }

  @override
  TimelineState build() => const TimelineState(isScrubbing: false);
}

// This provider watches the buckets from the timeline service & args and serves the segments.
// It should be used only after the timeline service and timeline args provider is overridden
final timelineSegmentProvider = StreamProvider.autoDispose<List<Segment>>(
  (ref) async* {
    final args = ref.watch(timelineArgsProvider);
    final columnCount = args.columnCount;
    final spacing = args.spacing;
    final availableTileWidth = args.maxWidth - (spacing * (columnCount - 1));
    final tileExtent = math.max(0, availableTileWidth) / columnCount;

    final groupBy = GroupAssetsBy
        .values[ref.watch(settingsProvider).get(Setting.groupAssetsBy)];

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
  },
  dependencies: [timelineServiceProvider, timelineArgsProvider],
);

final timelineStateProvider =
    NotifierProvider<TimelineStateNotifier, TimelineState>(
  TimelineStateNotifier.new,
);
