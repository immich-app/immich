import 'package:collection/collection.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';

class TimelineRow extends MultiChildRenderObjectWidget {
  final double height;
  final List<double> widths;
  final double spacing;
  final TextDirection textDirection;

  const TimelineRow({
    super.key,
    required this.height,
    required this.widths,
    required this.spacing,
    required this.textDirection,
    required super.children,
  });

  factory TimelineRow.fixed({
    required double dimension,
    required double spacing,
    required TextDirection textDirection,
    required List<Widget> children,
  }) => TimelineRow(
    height: dimension,
    widths: List.filled(children.length, dimension),
    spacing: spacing,
    textDirection: textDirection,
    children: children,
  );

  @override
  RenderObject createRenderObject(BuildContext context) {
    return RenderFixedRow(height: height, widths: widths, spacing: spacing, textDirection: textDirection);
  }

  @override
  void updateRenderObject(BuildContext context, RenderFixedRow renderObject) {
    renderObject.height = height;
    renderObject.widths = widths;
    renderObject.spacing = spacing;
    renderObject.textDirection = textDirection;
  }

  @override
  void debugFillProperties(DiagnosticPropertiesBuilder properties) {
    super.debugFillProperties(properties);
    properties.add(DoubleProperty('height', height));
    properties.add(DiagnosticsProperty<List<double>>('widths', widths));
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
    required double height,
    required List<double> widths,
    required double spacing,
    required TextDirection textDirection,
  }) : _height = height,
       _widths = widths,
       _spacing = spacing,
       _textDirection = textDirection {
    addAll(children);
  }

  double get height => _height;
  double _height;

  set height(double value) {
    if (_height == value) return;
    _height = value;
    markNeedsLayout();
  }

  List<double> get widths => _widths;
  List<double> _widths;

  set widths(List<double> value) {
    if (listEquals(_widths, value)) return;
    _widths = value;
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

  double get intrinsicWidth => widths.sum + (spacing * (childCount - 1));

  @override
  double computeMinIntrinsicWidth(double height) => intrinsicWidth;

  @override
  double computeMaxIntrinsicWidth(double height) => intrinsicWidth;

  @override
  double computeMinIntrinsicHeight(double width) => height;

  @override
  double computeMaxIntrinsicHeight(double width) => height;

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
    properties.add(DoubleProperty('height', height));
    properties.add(DiagnosticsProperty<List<double>>('widths', widths));
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
    size = Size(constraints.maxWidth, height);

    final flipMainAxis = textDirection == TextDirection.rtl;
    int childIndex = 0;
    double currentX = flipMainAxis ? size.width - (widths.firstOrNull ?? 0) : 0;
    // Layout each child horizontally.
    while (child != null && childIndex < widths.length) {
      final width = widths[childIndex];
      final childConstraints = BoxConstraints.tight(Size(width, height));
      child.layout(childConstraints, parentUsesSize: false);
      final childParentData = child.parentData! as _RowParentData;
      childParentData.offset = Offset(currentX, 0);
      child = childParentData.nextSibling;
      childIndex++;

      if (child != null && childIndex < widths.length) {
        final nextWidth = widths[childIndex];
        currentX += flipMainAxis ? -(spacing + nextWidth) : width + spacing;
      }
    }
  }
}
