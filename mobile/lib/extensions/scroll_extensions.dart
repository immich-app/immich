import 'package:flutter/cupertino.dart';

// https://stackoverflow.com/a/74453792
class FastScrollPhysics extends ScrollPhysics {
  const FastScrollPhysics({super.parent});

  @override
  FastScrollPhysics applyTo(ScrollPhysics? ancestor) {
    return FastScrollPhysics(parent: buildParent(ancestor));
  }

  @override
  SpringDescription get spring => const SpringDescription(mass: 1, stiffness: 402.49984375, damping: 40);
}

class FastClampingScrollPhysics extends ClampingScrollPhysics {
  const FastClampingScrollPhysics({super.parent});

  @override
  FastClampingScrollPhysics applyTo(ScrollPhysics? ancestor) {
    return FastClampingScrollPhysics(parent: buildParent(ancestor));
  }

  @override
  SpringDescription get spring => const SpringDescription(
    // When swiping between videos on Android, the placeholder of the first opened video
    // can briefly be seen and cause a flicker effect if the video begins to initialize
    // before the animation finishes - probably a bug in PhotoViewGallery's animation handling
    // Making the animation faster is not just stylistic, but also helps to avoid this flicker
    mass: 1,
    stiffness: 1601.2499609375,
    damping: 80,
  );
}

class SnapScrollController extends ScrollController {
  SnapScrollPosition get snapPosition => position as SnapScrollPosition;

  @override
  ScrollPosition createScrollPosition(ScrollPhysics physics, ScrollContext context, ScrollPosition? oldPosition) =>
      SnapScrollPosition(physics: physics, context: context, oldPosition: oldPosition);
}

class SnapScrollPosition extends ScrollPositionWithSingleContext {
  double snapOffset;

  SnapScrollPosition({required super.physics, required super.context, super.oldPosition, this.snapOffset = 0.0});

  @override
  bool get shouldIgnorePointer => false;
}

class SnapScrollPhysics extends ScrollPhysics {
  static const _minFlingVelocity = 700.0;
  static const minSnapDistance = 30.0;

  const SnapScrollPhysics({super.parent});

  @override
  SnapScrollPhysics applyTo(ScrollPhysics? ancestor) {
    return SnapScrollPhysics(parent: buildParent(ancestor));
  }

  @override
  Simulation? createBallisticSimulation(ScrollMetrics position, double velocity) {
    assert(
      position is SnapScrollPosition,
      'SnapScrollPhysics can only be used with Scrollables that use a '
      'controller whose createScrollPosition returns a SnapScrollPosition',
    );

    final snapOffset = (position as SnapScrollPosition).snapOffset;
    if (snapOffset <= 0) {
      return super.createBallisticSimulation(position, velocity);
    }

    if (position.pixels >= snapOffset) {
      final simulation = super.createBallisticSimulation(position, velocity);
      if (simulation == null || simulation.x(double.infinity) >= snapOffset) {
        return simulation;
      }
    }

    return ScrollSpringSimulation(spring, position.pixels, target(position, velocity, snapOffset), velocity);
  }

  @override
  SpringDescription get spring => SpringDescription.withDampingRatio(mass: .5, stiffness: 300);

  @override
  bool get allowImplicitScrolling => false;

  @override
  bool get allowUserScrolling => false;

  static double target(ScrollMetrics position, double velocity, double snapOffset) {
    if (velocity > _minFlingVelocity) return snapOffset;
    if (velocity < -_minFlingVelocity) return position.pixels < snapOffset ? 0.0 : snapOffset;
    return position.pixels < minSnapDistance ? 0.0 : snapOffset;
  }
}
