import 'package:flutter/cupertino.dart';

const _spring = SpringDescription(
  mass: 40,
  stiffness: 100,
  damping: 1,
);

// https://stackoverflow.com/a/74453792
class FastScrollPhysics extends ScrollPhysics {
  const FastScrollPhysics({super.parent});

  @override
  FastScrollPhysics applyTo(ScrollPhysics? ancestor) {
    return FastScrollPhysics(parent: buildParent(ancestor));
  }

  @override
  SpringDescription get spring => _spring;
}

class FastClampingScrollPhysics extends ClampingScrollPhysics {
  const FastClampingScrollPhysics({super.parent});

  @override
  FastClampingScrollPhysics applyTo(ScrollPhysics? ancestor) {
    return FastClampingScrollPhysics(parent: buildParent(ancestor));
  }

  @override
  SpringDescription get spring => _spring;
}
