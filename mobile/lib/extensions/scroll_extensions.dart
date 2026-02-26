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

class SnapScrollPhysics extends ScrollPhysics {
  static const _minFlingVelocity = 700.0;
  static const minSnapDistance = 30.0;

  static final _spring = SpringDescription.withDampingRatio(mass: .5, stiffness: 300);

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

    return ScrollSpringSimulation(
      _spring,
      position.pixels,
      target(position, velocity, snapOffset),
      velocity,
      tolerance: toleranceFor(position),
    );
  }

  static double target(ScrollMetrics position, double velocity, double snapOffset) {
    if (velocity > _minFlingVelocity) return snapOffset;
    if (velocity < -_minFlingVelocity) return position.pixels < snapOffset ? 0.0 : snapOffset;
    return position.pixels < minSnapDistance ? 0.0 : snapOffset;
  }
}

class SnapScrollPosition extends ScrollPositionWithSingleContext {
  double snapOffset;

  SnapScrollPosition({this.snapOffset = 0.0, required super.physics, required super.context, super.oldPosition});
}

class ProxyScrollController extends ScrollController {
  final ScrollController scrollController;

  ProxyScrollController({required this.scrollController});

  SnapScrollPosition get snapPosition => position as SnapScrollPosition;

  @override
  ScrollPosition createScrollPosition(ScrollPhysics physics, ScrollContext context, ScrollPosition? oldPosition) {
    return ProxyScrollPosition(
      scrollController: scrollController,
      physics: physics,
      context: context,
      oldPosition: oldPosition,
    );
  }

  @override
  void dispose() {
    scrollController.dispose();
    super.dispose();
  }
}

class ProxyScrollPosition extends SnapScrollPosition {
  final ScrollController scrollController;

  ProxyScrollPosition({
    required this.scrollController,
    required super.physics,
    required super.context,
    super.oldPosition,
  });

  @override
  double setPixels(double newPixels) {
    final overscroll = super.setPixels(newPixels);
    if (scrollController.hasClients && scrollController.position.pixels != pixels) {
      scrollController.position.forcePixels(pixels);
    }
    return overscroll;
  }

  @override
  void forcePixels(double value) {
    super.forcePixels(value);
    if (scrollController.hasClients && scrollController.position.pixels != pixels) {
      scrollController.position.forcePixels(pixels);
    }
  }

  @override
  double get maxScrollExtent => scrollController.hasClients && scrollController.position.hasContentDimensions
      ? scrollController.position.maxScrollExtent
      : super.maxScrollExtent;

  @override
  double get minScrollExtent => scrollController.hasClients && scrollController.position.hasContentDimensions
      ? scrollController.position.minScrollExtent
      : super.minScrollExtent;

  @override
  double get viewportDimension => scrollController.hasClients && scrollController.position.hasViewportDimension
      ? scrollController.position.viewportDimension
      : super.viewportDimension;
}
