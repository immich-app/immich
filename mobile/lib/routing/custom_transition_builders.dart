import 'package:flutter/material.dart';

class CustomTransitionsBuilders {
  const CustomTransitionsBuilders._();

  static const ZoomPageTransitionsBuilder zoomPageTransitionsBuilder =
      ZoomPageTransitionsBuilder();

  static const RouteTransitionsBuilder zoomedPage = _zoomedPage;

  static Widget _zoomedPage(
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    return zoomPageTransitionsBuilder.buildTransitions(
      // Empty PageRoute<> object, only used to pass allowSnapshotting to ZoomPageTransitionsBuilder
      PageRouteBuilder(
        allowSnapshotting: true,
        fullscreenDialog: false,
        pageBuilder: (context, animation, secondaryAnimation) =>
            const SizedBox.shrink(),
      ),
      context,
      animation,
      secondaryAnimation,
      child,
    );
  }
}
