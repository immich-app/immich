import 'dart:math' as math;

import 'package:flutter/widgets.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/presentation/widgets/images/thumbnail_tile.widget.dart';
import 'package:immich_mobile/presentation/widgets/timeline/fixed/row.dart';
import 'package:immich_mobile/presentation/widgets/timeline/header.widget.dart';
import 'package:immich_mobile/presentation/widgets/timeline/segment.model.dart';
import 'package:immich_mobile/presentation/widgets/timeline/segment_builder.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.state.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';

class FixedSegment extends Segment {
  final double tileHeight;
  final int columnCount;
  final double mainAxisExtend;

  const FixedSegment({
    required super.firstIndex,
    required super.lastIndex,
    required super.startOffset,
    required super.endOffset,
    required super.firstAssetIndex,
    required super.bucket,
    required this.tileHeight,
    required this.columnCount,
    required super.headerExtent,
    required super.spacing,
    required super.header,
  })  : assert(tileHeight != 0),
        mainAxisExtend = tileHeight + spacing;

  @override
  double indexToLayoutOffset(int index) {
    index -= gridIndex;
    if (index < 0) {
      return startOffset;
    }
    return gridOffset + (mainAxisExtend * index);
  }

  @override
  int getMinChildIndexForScrollOffset(double scrollOffset) {
    scrollOffset -= gridOffset;
    if (!scrollOffset.isFinite || scrollOffset < 0) {
      return firstIndex;
    }
    final rowsAbove = (scrollOffset / mainAxisExtend).floor();
    return gridIndex + rowsAbove;
  }

  @override
  int getMaxChildIndexForScrollOffset(double scrollOffset) {
    scrollOffset -= gridOffset;
    if (!scrollOffset.isFinite || scrollOffset < 0) {
      return firstIndex;
    }
    final firstRowBelow = (scrollOffset / mainAxisExtend).ceil();
    return gridIndex + firstRowBelow - 1;
  }

  @override
  Widget builder(BuildContext context, int index) {
    if (index == firstIndex) {
      return TimelineHeader(
        bucket: bucket,
        header: header,
        height: headerExtent,
      );
    }

    final rowIndexInSegment = index - (firstIndex + 1);
    final assetIndex = rowIndexInSegment * columnCount;
    final assetCount = bucket.assetCount;
    final numberOfAssets = math.min(columnCount, assetCount - assetIndex);

    return _buildRow(firstAssetIndex + assetIndex, numberOfAssets);
  }

  Widget _buildRow(int assetIndex, int count) => Consumer(
        builder: (ctx, ref, _) {
          final isScrubbing =
              ref.watch(timelineStateProvider.select((s) => s.isScrubbing));
          final timelineService = ref.read(timelineServiceProvider);

          // Timeline is being scrubbed, show placeholders
          if (isScrubbing) {
            return SegmentBuilder.buildPlaceholder(
              ctx,
              count,
              size: Size.square(tileHeight),
              spacing: spacing,
            );
          }

          // Bucket is already loaded, show the assets
          if (timelineService.hasRange(assetIndex, count)) {
            final assets = timelineService.getAssets(assetIndex, count);
            return _buildAssetRow(ctx, assets);
          }

          // Bucket is not loaded, show placeholders and load the bucket
          return FutureBuilder(
            future: timelineService.loadAssets(assetIndex, count),
            builder: (ctxx, snap) {
              if (snap.connectionState != ConnectionState.done) {
                return SegmentBuilder.buildPlaceholder(
                  ctx,
                  count,
                  size: Size.square(tileHeight),
                  spacing: spacing,
                );
              }

              return _buildAssetRow(ctxx, snap.requireData);
            },
          );
        },
      );

  Widget _buildAssetRow(BuildContext context, List<BaseAsset> assets) =>
      FixedTimelineRow(
        dimension: tileHeight,
        spacing: spacing,
        textDirection: Directionality.of(context),
        children: List.generate(
          assets.length,
          (i) => RepaintBoundary(child: ThumbnailTile(assets[i])),
        ),
      );
}
