import 'package:flutter/widgets.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/presentation/widgets/timeline/constants.dart';
import 'package:immich_mobile/presentation/widgets/timeline/fixed/row.dart';
import 'package:immich_mobile/widgets/asset_grid/thumbnail_placeholder.dart';

typedef SizedWidgetBuilder = Widget Function(BaseAsset asset, Size size);

typedef HeaderWidgetBuilder = Widget Function(
  BuildContext context,
  Bucket bucket,
  double height,
);

abstract class SegmentBuilder {
  final List<Bucket> buckets;
  final double spacing;
  final double headerExtent;
  final HeaderWidgetBuilder? headerBuilder;
  final SizedWidgetBuilder tileBuilder;

  const SegmentBuilder({
    required this.buckets,
    this.spacing = kTimelineSpacing,
    this.headerExtent = kTimelineHeaderExtent,
    this.headerBuilder,
    required this.tileBuilder,
  }) : assert(
          headerExtent > 0 && headerBuilder != null ||
              headerExtent <= 0 && headerBuilder == null,
          'Header builder must be provided if header extent is greater than 0',
        );

  Widget buildAssetRow(BuildContext context, List<Asset> assets);

  Widget buildPlaceholder(BuildContext context, int count, Size size) =>
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
