import 'package:collection/collection.dart';
import 'package:flutter/widgets.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';

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
  // The spacing between the header and the first row of the segment.
  final double spacing;
  final double headerExtent;
  // the start index of the asset of this segment from the beginning of the timeline.
  final int firstAssetIndex;
  final Bucket bucket;

  // The index of the row after the header
  final int gridIndex;
  // The offset of the row after the header
  final double gridOffset;
  // The type of the header
  final HeaderType header;

  const Segment({
    required this.firstIndex,
    required this.lastIndex,
    required this.startOffset,
    required this.endOffset,
    required this.firstAssetIndex,
    required this.bucket,
    required this.headerExtent,
    required this.spacing,
    required this.header,
  })  : gridIndex = firstIndex + 1,
        gridOffset = startOffset + headerExtent + spacing;

  bool containsIndex(int index) => firstIndex <= index && index <= lastIndex;

  bool isWithinOffset(double offset) =>
      startOffset <= offset && offset <= endOffset;

  int getMinChildIndexForScrollOffset(double scrollOffset);
  int getMaxChildIndexForScrollOffset(double scrollOffset);
  double indexToLayoutOffset(int index);

  Widget builder(BuildContext context, int index);

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is Segment &&
        other.firstIndex == firstIndex &&
        other.lastIndex == lastIndex &&
        other.startOffset == startOffset &&
        other.endOffset == endOffset &&
        other.spacing == spacing &&
        other.firstAssetIndex == firstAssetIndex &&
        other.headerExtent == headerExtent &&
        other.gridIndex == gridIndex &&
        other.gridOffset == gridOffset &&
        other.header == header;
  }

  @override
  int get hashCode =>
      firstIndex.hashCode ^
      lastIndex.hashCode ^
      startOffset.hashCode ^
      endOffset.hashCode ^
      spacing.hashCode ^
      headerExtent.hashCode ^
      firstAssetIndex.hashCode ^
      gridIndex.hashCode ^
      gridOffset.hashCode ^
      header.hashCode;

  @override
  String toString() {
    return 'Segment(firstIndex: $firstIndex, lastIndex: $lastIndex)';
  }
}

extension SegmentListExtension on List<Segment> {
  bool equals(List<Segment> other) =>
      length == other.length &&
      lastOrNull?.endOffset == other.lastOrNull?.endOffset;

  Segment? findByIndex(int index) =>
      firstWhereOrNull((s) => s.containsIndex(index));

  Segment? findByOffset(double offset) =>
      firstWhereOrNull((s) => s.isWithinOffset(offset)) ?? lastOrNull;
}
