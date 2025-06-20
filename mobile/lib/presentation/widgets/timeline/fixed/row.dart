import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';

class FixedTimelineRow extends MultiChildRenderObjectWidget {
  final double dimension;
  final double spacing;
  final TextDirection textDirection;

  const FixedTimelineRow({
    super.key,
    required this.dimension,
    required this.spacing,
    required this.textDirection,
    required super.children,
  });

  @override
  RenderObject createRenderObject(BuildContext context) {
    return RenderFixedRow(
      dimension: dimension,
      spacing: spacing,
      textDirection: textDirection,
    );
  }

  @override
  void updateRenderObject(BuildContext context, RenderFixedRow renderObject) {
    renderObject.dimension = dimension;
    renderObject.spacing = spacing;
    renderObject.textDirection = textDirection;
  }

  @override
  void debugFillProperties(DiagnosticPropertiesBuilder properties) {
    super.debugFillProperties(properties);
    properties.add(DoubleProperty('dimension', dimension));
    properties.add(DoubleProperty('spacing', spacing));
    properties.add(EnumProperty<TextDirection>('textDirection', textDirection));
  }
}

class _RowParentData extends ContainerBoxParentData<RenderBox> {}

class RenderFixedRow extends RenderBox
    with
        ContainerRenderObjectMixin<RenderBox, _RowParentData>,
        RenderBoxContainerDefaultsMixin<RenderBox, _RowParentData> {
  RenderFixedRow({
    List<RenderBox>? children,
    required double dimension,
    required double spacing,
    required TextDirection textDirection,
  })  : _dimension = dimension,
        _spacing = spacing,
        _textDirection = textDirection {
    addAll(children);
  }

  double get dimension => _dimension;
  double _dimension;

  set dimension(double value) {
    if (_dimension == value) return;
    _dimension = value;
    markNeedsLayout();
  }

  double get spacing => _spacing;
  double _spacing;

  set spacing(double value) {
    if (_spacing == value) return;
    _spacing = value;
    markNeedsLayout();
  }

  TextDirection get textDirection => _textDirection;
  TextDirection _textDirection;

  set textDirection(TextDirection value) {
    if (_textDirection == value) return;
    _textDirection = value;
    markNeedsLayout();
  }

  @override
  void setupParentData(RenderBox child) {
    if (child.parentData is! _RowParentData) {
      child.parentData = _RowParentData();
    }
  }

  double get intrinsicWidth =>
      dimension * childCount + spacing * (childCount - 1);

  @override
  double computeMinIntrinsicWidth(double height) => intrinsicWidth;

  @override
  double computeMaxIntrinsicWidth(double height) => intrinsicWidth;

  @override
  double computeMinIntrinsicHeight(double width) => dimension;

  @override
  double computeMaxIntrinsicHeight(double width) => dimension;

  @override
  double? computeDistanceToActualBaseline(TextBaseline baseline) {
    return defaultComputeDistanceToHighestActualBaseline(baseline);
  }

  @override
  bool hitTestChildren(BoxHitTestResult result, {required Offset position}) {
    return defaultHitTestChildren(result, position: position);
  }

  @override
  void paint(PaintingContext context, Offset offset) {
    defaultPaint(context, offset);
  }

  @override
  void debugFillProperties(DiagnosticPropertiesBuilder properties) {
    super.debugFillProperties(properties);
    properties.add(DoubleProperty('dimension', dimension));
    properties.add(DoubleProperty('spacing', spacing));
    properties.add(EnumProperty<TextDirection>('textDirection', textDirection));
  }

  @override
  void performLayout() {
    RenderBox? child = firstChild;
    if (child == null) {
      size = constraints.smallest;
      return;
    }
    // Use the entire width of the parent for the row.
    size = Size(constraints.maxWidth, dimension);
    // Each tile is forced to be dimension x dimension.
    final childConstraints = BoxConstraints.tight(Size(dimension, dimension));
    final flipMainAxis = textDirection == TextDirection.rtl;
    Offset offset = Offset(flipMainAxis ? size.width - dimension : 0, 0);
    final dx = (flipMainAxis ? -1 : 1) * (dimension + spacing);
    // Layout each child horizontally.
    while (child != null) {
      child.layout(childConstraints, parentUsesSize: false);
      final childParentData = child.parentData! as _RowParentData;
      childParentData.offset = offset;
      offset += Offset(dx, 0);
      child = childParentData.nextSibling;
    }
  }
}
