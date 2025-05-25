import 'package:flutter/widgets.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';

typedef SegmentWidgetBuilder = Widget Function(
  BuildContext context,
  int index,
);

// Segments are the time groups buckets in the timeline view.
// Each segment contains a header and a list of asset rows.
abstract class Segment {
  // The index of the first row of the segment, usually the header, but if not, it can be any asset.
  final int firstIndex;
  // The index of the last asset of the segment.
  final int lastIndex;
  // The offset of the first row from beginning of the timeline.
  final double startOffset;
  // The offset of the last row from beginning of the timeline.
  final double endOffset;

  final double spacing;
  final double headerExtent;

  final int assetIndex;
  final double assetOffset;

  final SegmentWidgetBuilder builder;

  final Bucket bucket;

  const Segment({
    required this.firstIndex,
    required this.lastIndex,
    required this.startOffset,
    required this.endOffset,
    required this.bucket,
    required this.headerExtent,
    required this.spacing,
    required this.builder,
  })  : assetIndex = firstIndex + 1,
        assetOffset = startOffset + headerExtent + spacing;

  bool containsIndex(int index) => firstIndex <= index && index <= lastIndex;

  bool isWithinOffset(double offset) =>
      startOffset <= offset && offset <= endOffset;

  int getMinChildIndexForScrollOffset(double scrollOffset);
  int getMaxChildIndexForScrollOffset(double scrollOffset);
  double indexToLayoutOffset(int index);

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is Segment &&
        other.firstIndex == firstIndex &&
        other.lastIndex == lastIndex &&
        other.startOffset == startOffset &&
        other.endOffset == endOffset &&
        other.spacing == spacing &&
        other.headerExtent == headerExtent &&
        other.assetIndex == assetIndex &&
        other.assetOffset == assetOffset;
  }

  @override
  int get hashCode =>
      firstIndex.hashCode ^
      lastIndex.hashCode ^
      startOffset.hashCode ^
      endOffset.hashCode ^
      spacing.hashCode ^
      headerExtent.hashCode ^
      assetIndex.hashCode ^
      assetOffset.hashCode;

  @override
  String toString() {
    return 'Segment(firstIndex: $firstIndex, lastIndex: $lastIndex)';
  }
}

extension SegmentListExtension on List<Segment> {
  bool equals(List<Segment> other) {
    if (length != other.length) {
      return false;
    }
    return lastOrNull?.endOffset == other.lastOrNull?.endOffset;
  }
}
