import 'package:flutter/cupertino.dart';

// https://stackoverflow.com/a/74453792
class FastScrollPhysics extends ScrollPhysics {
  const FastScrollPhysics({super.parent});

  @override
  FastScrollPhysics applyTo(ScrollPhysics? ancestor) {
    return FastScrollPhysics(parent: buildParent(ancestor));
  }

  @override
  SpringDescription get spring => const SpringDescription(
        mass: 40,
        stiffness: 100,
        damping: 1,
      );
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
        mass: 80,
        stiffness: 100,
        damping: 1,
      );
}
