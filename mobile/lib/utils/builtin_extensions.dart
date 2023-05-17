import 'package:collection/collection.dart';

extension DurationExtension on String {
  Duration? toDuration() {
    try {
      final parts = split(':')
          .map((e) => double.parse(e).toInt())
          .toList(growable: false);
      return Duration(hours: parts[0], minutes: parts[1], seconds: parts[2]);
    } catch (e) {
      return null;
    }
  }

  double toDouble() {
    return double.parse(this);
  }

  int toInt() {
    return int.parse(this);
  }
}

extension ListExtension<E> on List<E> {
  List<E> uniqueConsecutive<T>([T Function(E element)? key]) {
    key ??= (E e) => e as T;
    int i = 1, j = 1;
    for (; i < length; i++) {
      if (key(this[i]) != key(this[i - 1])) {
        if (i != j) {
          this[j] = this[i];
        }
        j++;
      }
    }
    length = length == 0 ? 0 : j;
    return this;
  }

  ListSlice<E> nestedSlice(int start, int end) {
    if (this is ListSlice) {
      final ListSlice<E> self = this as ListSlice<E>;
      return ListSlice<E>(self.source, self.start + start, self.start + end);
    }
    return ListSlice<E>(this, start, end);
  }
}
