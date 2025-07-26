import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/presentation/widgets/timeline/constants.dart';

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
}
