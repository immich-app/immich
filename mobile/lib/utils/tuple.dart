/// An immutable pair or 2-tuple
/// TODO replace with Record once Dart 2.19 is available
class Pair<T1, T2> {
  final T1 first;
  final T2 second;

  const Pair(this.first, this.second);
}

/// An immutable triple or 3-tuple
/// TODO replace with Record once Dart 2.19 is available
class Triple<T1, T2, T3> {
  final T1 first;
  final T2 second;
  final T3 third;

  const Triple(this.first, this.second, this.third);
}
