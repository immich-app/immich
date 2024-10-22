extension SortIterable<T> on Iterable<T> {
  Iterable<T> sortedBy(Comparable Function(T k) key) =>
      List.of(this)..sort((a, b) => key(a).compareTo(key(b)));
}
