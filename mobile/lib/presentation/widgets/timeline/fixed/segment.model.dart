import 'package:immich_mobile/presentation/widgets/timeline/segment.model.dart';

class FixedSegment extends Segment {
  final double tileHeight;
  final double mainAxisExtend;

  const FixedSegment({
    required super.firstIndex,
    required super.lastIndex,
    required super.startOffset,
    required super.endOffset,
    required super.bucket,
    required this.tileHeight,
    required super.headerExtent,
    required super.spacing,
    required super.builder,
  }) : mainAxisExtend = tileHeight + spacing;

  @override
  double indexToLayoutOffset(int index) {
    index -= assetIndex;
    if (index < 0) {
      return startOffset;
    }
    return assetOffset + (mainAxisExtend * index);
  }

  @override
  int getMinChildIndexForScrollOffset(double scrollOffset) {
    scrollOffset -= assetOffset;
    if (tileHeight == 0 || !scrollOffset.isFinite || scrollOffset < 0) {
      return firstIndex;
    }
    final rowsAbove = (scrollOffset / mainAxisExtend).floor();
    return assetIndex + rowsAbove;
  }

  @override
  int getMaxChildIndexForScrollOffset(double scrollOffset) {
    scrollOffset -= assetOffset;
    if (tileHeight == 0 || !scrollOffset.isFinite || scrollOffset < 0) {
      return firstIndex;
    }
    final firstRowBelow = (scrollOffset / mainAxisExtend).ceil();
    return assetIndex + firstRowBelow - 1;
  }
}
