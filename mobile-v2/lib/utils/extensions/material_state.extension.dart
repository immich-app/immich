import 'package:flutter/material.dart';

extension MaterialStateHelpers on Iterable<WidgetState> {
  bool get isDisabled => contains(WidgetState.disabled);
  bool get isDragged => contains(WidgetState.dragged);
  bool get isError => contains(WidgetState.error);
  bool get isFocused => contains(WidgetState.focused);
  bool get isHovered => contains(WidgetState.hovered);
  bool get isPressed => contains(WidgetState.pressed);
  bool get isScrolledUnder => contains(WidgetState.scrolledUnder);
  bool get isSelected => contains(WidgetState.selected);
}
