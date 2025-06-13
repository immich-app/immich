import 'dart:math' as math;

import 'package:flutter/widgets.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/presentation/widgets/timeline/fixed/row.dart';
import 'package:immich_mobile/presentation/widgets/timeline/fixed/segment.model.dart';
import 'package:immich_mobile/presentation/widgets/timeline/segment.model.dart';
import 'package:immich_mobile/presentation/widgets/timeline/segment_builder.widget.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.state.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';

class FixedSegmentBuilder extends SegmentBuilder {
  final double tileHeight;
  final int columnCount;

  const FixedSegmentBuilder({
    required super.buckets,
    required this.tileHeight,
    required this.columnCount,
    super.spacing,
    super.headerExtent,
    super.headerBuilder,
    required super.tileBuilder,
  });

  List<Segment> build() {
    final segments = <Segment>[];

    int firstIndex = 0;
    double startOffset = 0;
    int assetOffset = 0;

    for (int i = 0; i < buckets.length; i++) {
      final bucket = buckets[i];

      final assetCount = bucket.assetCount;
      final numberOfRows = (assetCount / columnCount).ceil();
      final segmentCount = numberOfRows + 1;

      final segmentFirstIndex = firstIndex;
      firstIndex += segmentCount;
      final segmentLastIndex = firstIndex - 1;

      final segmentStartOffset = startOffset;
      startOffset += headerExtent +
          (tileHeight * numberOfRows) +
          spacing * (numberOfRows - 1);
      final segmentEndOffset = startOffset;

      segments.add(
        _buildSegment(
          segmentFirstIndex,
          segmentLastIndex,
          segmentStartOffset,
          segmentEndOffset,
          assetOffset,
          bucket,
        ),
      );

      assetOffset += assetCount;
    }
    return segments;
  }

  Segment _buildSegment(
    int segmentFirstIndex,
    int segmentLastIndex,
    double segmentStartOffset,
    double segmentEndOffset,
    int assetOffset,
    Bucket bucket,
  ) {
    return FixedSegment(
      firstIndex: segmentFirstIndex,
      lastIndex: segmentLastIndex,
      startOffset: segmentStartOffset,
      endOffset: segmentEndOffset,
      bucket: bucket,
      tileHeight: tileHeight,
      headerExtent: headerExtent,
      spacing: spacing,
      builder: (context, index) {
        if (index == segmentFirstIndex) {
          return headerExtent > 0
              ? headerBuilder!(context, bucket, headerExtent)
              : const SizedBox();
        }

        final rowIndexInSegment = index - (segmentFirstIndex + 1);
        final assetIndex = rowIndexInSegment * columnCount;
        final assetCount = bucket.assetCount;
        final numberOfAssets = math.min(columnCount, assetCount - assetIndex);

        return buildRow(assetOffset + assetIndex, numberOfAssets);
      },
    );
  }

  Widget buildRow(int assetIndex, int count) => Consumer(
        builder: (ctx, ref, _) {
          final isScrubbing =
              ref.watch(timelineStateProvider.select((s) => s.isScrubbing));
          final timelineService = ref.read(timelineServiceProvider);

          // Timeline is being scrubbed, show placeholders
          if (isScrubbing) {
            return buildPlaceholder(ctx, count, Size.square(tileHeight));
          }

          // Bucket is already loaded, show the assets
          if (timelineService.hasRange(assetIndex, count)) {
            final assets = timelineService.getAssets(assetIndex, count);
            return buildAssetRow(ctx, assets);
          }

          // Bucket is not loaded, show placeholders and load the bucket
          return FutureBuilder(
            future: timelineService.loadAssets(assetIndex, count),
            builder: (ctxx, snap) {
              if (snap.connectionState != ConnectionState.done) {
                return buildPlaceholder(ctx, count, Size.square(tileHeight));
              }

              return buildAssetRow(ctxx, snap.requireData);
            },
          );
        },
      );

  @override
  Widget buildAssetRow(BuildContext context, List<BaseAsset> assets) =>
      FixedTimelineRow(
        dimension: tileHeight,
        spacing: spacing,
        textDirection: Directionality.of(context),
        children: List.generate(
          assets.length,
          (i) => RepaintBoundary(
            child: tileBuilder(assets[i], Size.square(tileHeight)),
          ),
        ),
      );
}
