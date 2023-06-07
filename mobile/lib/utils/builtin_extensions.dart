import 'dart:typed_data';

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
  List<E> uniqueConsecutive({
    int Function(E a, E b)? compare,
    void Function(E a, E b)? onDuplicate,
  }) {
    compare ??= (E a, E b) => a == b ? 0 : 1;
    int i = 1, j = 1;
    for (; i < length; i++) {
      if (compare(this[i - 1], this[i]) != 0) {
        if (i != j) {
          this[j] = this[i];
        }
        j++;
      } else if (onDuplicate != null) {
        onDuplicate(this[i - 1], this[i]);
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

extension IntListExtension on Iterable<int> {
  Int64List toInt64List() {
    final list = Int64List(length);
    list.setAll(0, this);
    return list;
  }
}
