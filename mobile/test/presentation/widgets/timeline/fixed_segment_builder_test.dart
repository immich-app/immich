import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/presentation/widgets/timeline/fixed/segment.model.dart';
import 'package:immich_mobile/presentation/widgets/timeline/fixed/segment_builder.dart';
import 'package:immich_mobile/presentation/widgets/timeline/segment.model.dart';

void main() {
  group('FixedSegmentBuilder', () {
    test('should generate segments with monotonic, non-overlapping offsets', () {
      const tileHeight = 100.0;
      const columnCount = 3;
      const spacing = 2.0;

      final buckets = [
        TimeBucket(date: DateTime(2024, 1, 1), assetCount: 5),
        TimeBucket(date: DateTime(2024, 1, 2), assetCount: 7),
        TimeBucket(date: DateTime(2024, 1, 3), assetCount: 2),
      ];

      final builder = FixedSegmentBuilder(
        buckets: buckets,
        tileHeight: tileHeight,
        columnCount: columnCount,
        spacing: spacing,
        groupBy: GroupAssetsBy.day,
      );

      final segments = builder.generate();

      // Verify segments are non-empty
      expect(segments.length, greaterThan(0));

      // Verify monotonic, non-overlapping offsets
      for (int i = 0; i < segments.length - 1; i++) {
        final current = segments[i];
        final next = segments[i + 1];

        expect(
          current.endOffset,
          lessThanOrEqualTo(next.startOffset),
          reason: 'Segment $i endOffset should be <= segment ${i + 1} startOffset',
        );
        expect(
          current.startOffset,
          lessThanOrEqualTo(current.endOffset),
          reason: 'Segment $i should have valid offset range',
        );
      }
    });

    test('should handle empty buckets correctly', () {
      const tileHeight = 100.0;
      const columnCount = 3;
      const spacing = 2.0;

      final buckets = [
        TimeBucket(date: DateTime(2024, 1, 1), assetCount: 0),
        TimeBucket(date: DateTime(2024, 1, 2), assetCount: 5),
      ];

      final builder = FixedSegmentBuilder(
        buckets: buckets,
        tileHeight: tileHeight,
        columnCount: columnCount,
        spacing: spacing,
        groupBy: GroupAssetsBy.day,
      );

      final segments = builder.generate();

      expect(segments.length, equals(2));

      // Verify offsets are still monotonic even with empty bucket
      expect(
        segments[0].endOffset,
        lessThanOrEqualTo(segments[1].startOffset),
      );
    });

    test('should compute correct gridOffset alignment', () {
      const tileHeight = 100.0;
      const columnCount = 3;
      const spacing = 2.0;

      final buckets = [
        TimeBucket(date: DateTime(2024, 1, 1), assetCount: 5),
      ];

      final builder = FixedSegmentBuilder(
        buckets: buckets,
        tileHeight: tileHeight,
        columnCount: columnCount,
        spacing: spacing,
        groupBy: GroupAssetsBy.day,
      );

      final segments = builder.generate();
      expect(segments.length, equals(1));

      final segment = segments[0] as FixedSegment;
      final expectedGridOffset = segment.startOffset + segment.headerExtent + spacing;

      expect(segment.gridOffset, equals(expectedGridOffset));
    });

    test('should handle findByOffset correctly at segment boundaries', () {
      const tileHeight = 100.0;
      const columnCount = 3;
      const spacing = 2.0;

      final buckets = [
        TimeBucket(date: DateTime(2024, 1, 1), assetCount: 5),
        TimeBucket(date: DateTime(2024, 1, 2), assetCount: 7),
      ];

      final builder = FixedSegmentBuilder(
        buckets: buckets,
        tileHeight: tileHeight,
        columnCount: columnCount,
        spacing: spacing,
        groupBy: GroupAssetsBy.day,
      );

      final segments = builder.generate();

      // Test at boundary between segments
      final boundaryOffset = segments[0].endOffset;
      final foundSegment = segments.findByOffset(boundaryOffset);

      // Should find a segment (either the first or second, depending on implementation)
      expect(foundSegment, isNotNull);
      expect(foundSegment!.isWithinOffset(boundaryOffset), isTrue);
    });

    test('should compute indexToLayoutOffset monotonically within segment', () {
      const tileHeight = 100.0;
      const columnCount = 3;
      const spacing = 2.0;

      final buckets = [
        TimeBucket(date: DateTime(2024, 1, 1), assetCount: 5),
      ];

      final builder = FixedSegmentBuilder(
        buckets: buckets,
        tileHeight: tileHeight,
        columnCount: columnCount,
        spacing: spacing,
        groupBy: GroupAssetsBy.day,
      );

      final segments = builder.generate();
      final segment = segments[0];

      // Verify monotonicity: each index should have offset >= previous
      for (int i = segment.firstIndex; i < segment.lastIndex; i++) {
        final currentOffset = segment.indexToLayoutOffset(i);
        final nextOffset = segment.indexToLayoutOffset(i + 1);
        expect(
          nextOffset,
          greaterThanOrEqualTo(currentOffset),
          reason: 'indexToLayoutOffset should be monotonic',
        );
      }
    });
  });
}

