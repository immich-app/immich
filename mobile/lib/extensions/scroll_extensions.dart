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

class ScrollUnawareScrollPhysics extends ScrollPhysics {
  const ScrollUnawareScrollPhysics({super.parent});

  @override
  ScrollUnawareScrollPhysics applyTo(ScrollPhysics? ancestor) {
    return ScrollUnawareScrollPhysics(parent: buildParent(ancestor));
  }

  @override
  bool recommendDeferredLoading(double velocity, ScrollMetrics metrics, BuildContext context) {
    return false;
  }
}

class ScrollUnawareClampingScrollPhysics extends ClampingScrollPhysics {
  const ScrollUnawareClampingScrollPhysics({super.parent});

  @override
  ScrollUnawareClampingScrollPhysics applyTo(ScrollPhysics? ancestor) {
    return ScrollUnawareClampingScrollPhysics(parent: buildParent(ancestor));
  }

  @override
  bool recommendDeferredLoading(double velocity, ScrollMetrics metrics, BuildContext context) {
    return false;
  }
}
