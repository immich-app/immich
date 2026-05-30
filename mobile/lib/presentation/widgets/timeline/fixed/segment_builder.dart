import 'dart:math' as math;

import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/presentation/widgets/timeline/constants.dart' show kTimelineMonthLabelMaxColumns;
import 'package:immich_mobile/presentation/widgets/timeline/fixed/segment.model.dart';
import 'package:immich_mobile/presentation/widgets/timeline/segment.model.dart';
import 'package:immich_mobile/presentation/widgets/timeline/segment_builder.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.state.dart';

class FixedSegmentBuilder extends SegmentBuilder {
  final double tileHeight;
  final int columnCount;

  const FixedSegmentBuilder({
    required super.buckets,
    required this.tileHeight,
    required this.columnCount,
    super.spacing,
    super.groupBy,
  });

  List<Segment> generate() {
    final isContinuous = isContinuousTimelineLayout(columnCount, groupBy);
    // At the wide zoom levels (>6 cols) with a date-based grouping
    // (day/month/auto), aggregate consecutive buckets into one segment per
    // visible period — month at 16-wide, year at 32-wide — and leave a blank
    // row of vertical space between them so the user's grouping preference
    // is still visible at a glance. "No grouping" stays asset-level chunked.
    final usePeriodGaps = isContinuous && groupBy != GroupAssetsBy.none;
    final isYearPeriod = columnCount >= kTimelineMonthLabelMaxColumns * 2;

    final segments = <Segment>[];
    int firstIndex = 0;
    double startOffset = 0;
    int assetIndex = 0;
    DateTime? previousDate;

    final List<Bucket> effectiveBuckets;
    if (!isContinuous) {
      effectiveBuckets = buckets;
    } else if (usePeriodGaps) {
      effectiveBuckets = _aggregateByPeriod(year: isYearPeriod);
    } else {
      effectiveBuckets = _alignContinuousBuckets();
    }

    for (int i = 0; i < effectiveBuckets.length; i++) {
      final bucket = effectiveBuckets[i];

      final assetCount = bucket.assetCount;
      final numberOfRows = (assetCount / columnCount).ceil();
      final segmentCount = numberOfRows + 1;

      final segmentFirstIndex = firstIndex;
      firstIndex += segmentCount;
      final segmentLastIndex = firstIndex - 1;

      final timelineHeader = isContinuous
          ? HeaderType.none
          : switch (groupBy) {
              GroupAssetsBy.month => HeaderType.month,
              GroupAssetsBy.day || GroupAssetsBy.auto =>
                bucket is TimeBucket && bucket.date.month != previousDate?.month
                    ? HeaderType.monthAndDay
                    : HeaderType.day,
              GroupAssetsBy.none => HeaderType.none,
            };
      // For period-gapped segments the header is invisible (HeaderType.none)
      // but reserves a row's worth of vertical space, so the period boundary
      // reads as a blank gap. The very first segment skips the gap.
      final double headerExtent;
      if (usePeriodGaps && i > 0) {
        headerExtent = tileHeight + spacing;
      } else {
        headerExtent = SegmentBuilder.headerExtent(timelineHeader);
      }

      final segmentStartOffset = startOffset;
      startOffset += headerExtent + (tileHeight * numberOfRows) + spacing * (numberOfRows - 1);
      final segmentEndOffset = startOffset;

      segments.add(
        FixedSegment(
          firstIndex: segmentFirstIndex,
          lastIndex: segmentLastIndex,
          startOffset: segmentStartOffset,
          endOffset: segmentEndOffset,
          firstAssetIndex: assetIndex,
          bucket: bucket,
          tileHeight: tileHeight,
          columnCount: columnCount,
          headerExtent: headerExtent,
          spacing: spacing,
          header: timelineHeader,
        ),
      );

      assetIndex += assetCount;
      if (bucket is TimeBucket) {
        previousDate = bucket.date;
      }
    }
    return segments;
  }

  /// Walks [buckets] and merges all consecutive entries whose dates fall in the
  /// same period — same year for [year] = true, same year-and-month otherwise —
  /// into a single [TimeBucket]. Buckets without a date (rare; only the
  /// no-grouping merged-bucket path) flush the current accumulator and become
  /// their own segment. Used by the wide-zoom day/month/auto layout to give one
  /// segment per visible period.
  List<Bucket> _aggregateByPeriod({required bool year}) {
    if (buckets.isEmpty) {
      return const [];
    }
    final result = <Bucket>[];
    int accumulatedCount = 0;
    DateTime? accumulatedDate;

    void flush() {
      if (accumulatedCount <= 0) {
        return;
      }
      result.add(
        accumulatedDate != null
            ? TimeBucket(assetCount: accumulatedCount, date: accumulatedDate!)
            : Bucket(assetCount: accumulatedCount),
      );
      accumulatedCount = 0;
      accumulatedDate = null;
    }

    bool samePeriod(DateTime a, DateTime b) {
      if (a.year != b.year) {
        return false;
      }
      return year || a.month == b.month;
    }

    for (final bucket in buckets) {
      final bucketDate = bucket is TimeBucket ? bucket.date : null;
      if (bucketDate == null) {
        flush();
        result.add(Bucket(assetCount: bucket.assetCount));
        continue;
      }
      if (accumulatedDate == null) {
        accumulatedDate = bucketDate;
        accumulatedCount = bucket.assetCount;
      } else if (samePeriod(accumulatedDate!, bucketDate)) {
        accumulatedCount += bucket.assetCount;
      } else {
        flush();
        accumulatedDate = bucketDate;
        accumulatedCount = bucket.assetCount;
      }
    }
    flush();
    return result;
  }

  /// Re-slices all buckets into continuous chunks whose size is a multiple of
  /// [columnCount], so every row is full and no interior gaps appear. Each chunk
  /// inherits the date of its first asset's source bucket so the scrubber and any
  /// month/year UI can still resolve dates from segments at the wider zoom levels.
  List<Bucket> _alignContinuousBuckets() {
    if (buckets.isEmpty) {
      return const [];
    }
    final chunkSize = math.max(columnCount, (kTimelineNoneSegmentSize ~/ columnCount) * columnCount);
    final result = <Bucket>[];
    int chunkRemaining = 0;
    DateTime? chunkDate;

    void flush() {
      if (chunkRemaining <= 0) {
        return;
      }
      result.add(
        chunkDate != null
            ? TimeBucket(assetCount: chunkRemaining, date: chunkDate!)
            : Bucket(assetCount: chunkRemaining),
      );
      chunkRemaining = 0;
      chunkDate = null;
    }

    for (final bucket in buckets) {
      final bucketDate = bucket is TimeBucket ? bucket.date : null;
      int taken = bucket.assetCount;
      while (taken > 0) {
        if (chunkRemaining == 0) {
          chunkDate = bucketDate;
        }
        final space = chunkSize - chunkRemaining;
        final take = math.min(taken, space);
        chunkRemaining += take;
        taken -= take;
        if (chunkRemaining == chunkSize) {
          flush();
        }
      }
    }
    flush();
    return result;
  }
}
