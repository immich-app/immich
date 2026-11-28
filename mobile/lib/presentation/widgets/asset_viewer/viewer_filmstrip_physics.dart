import 'package:flutter/physics.dart';
import 'package:flutter/widgets.dart';

class SnapToItemPhysics extends ScrollPhysics {
  final double itemSlot;
  final ValueGetter<bool> isSnapping;

  const SnapToItemPhysics({required this.itemSlot, required this.isSnapping, super.parent});

  @override
  SnapToItemPhysics applyTo(ScrollPhysics? ancestor) =>
      SnapToItemPhysics(itemSlot: itemSlot, isSnapping: isSnapping, parent: buildParent(ancestor));

  @override
  Simulation? createBallisticSimulation(ScrollMetrics position, double velocity) {
    if (!isSnapping() ||
        (velocity <= 0 && position.pixels <= position.minScrollExtent) ||
        (velocity >= 0 && position.pixels >= position.maxScrollExtent)) {
      return super.createBallisticSimulation(position, velocity);
    }

    final tolerance = toleranceFor(position);
    final projected = super.createBallisticSimulation(position, velocity)?.x(double.infinity) ?? position.pixels;
    final lastSlot = (position.maxScrollExtent / itemSlot).floor();
    final target = (projected / itemSlot).round().clamp(0, lastSlot) * itemSlot;

    if (velocity.abs() < tolerance.velocity && (target - position.pixels).abs() < tolerance.distance) {
      return null;
    }

    if ((position.pixels / itemSlot).round() == (target / itemSlot).round()) {
      return SpringSimulation(spring, position.pixels, target, velocity, tolerance: tolerance);
    }

    return FrictionSimulation.through(position.pixels, target, velocity, tolerance.velocity * velocity.sign);
  }
}
