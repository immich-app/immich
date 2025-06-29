import 'package:flutter/widgets.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/presentation/widgets/timeline/constants.dart';
import 'package:immich_mobile/presentation/widgets/timeline/fixed/row.dart';
import 'package:immich_mobile/widgets/asset_grid/thumbnail_placeholder.dart';

abstract class SegmentBuilder {
  final List<Bucket> buckets;
  final double spacing;
  final GroupAssetsBy groupBy;

  const SegmentBuilder({
    required this.buckets,
    this.spacing = kTimelineSpacing,
    this.groupBy = GroupAssetsBy.day,
  });

  static double headerExtent(HeaderType header) => switch (header) {
        HeaderType.month => kTimelineHeaderExtent,
        HeaderType.day => kTimelineHeaderExtent * 0.90,
        HeaderType.monthAndDay => kTimelineHeaderExtent * 1.6,
        HeaderType.none => 0.0,
      };

  static Widget buildPlaceholder(
    BuildContext context,
    int count, {
    Size size = const Size.square(kTimelineFixedTileExtent),
    double spacing = kTimelineSpacing,
  }) =>
      RepaintBoundary(
        child: FixedTimelineRow(
          dimension: size.height,
          spacing: spacing,
          textDirection: Directionality.of(context),
          children: List.generate(
            count,
            (_) => ThumbnailPlaceholder(width: size.width, height: size.height),
          ),
        ),
      );
}
