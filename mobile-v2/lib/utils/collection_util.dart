// ignore_for_file: avoid-unsafe-collection-methods

import 'dart:async';

class CollectionUtil {
  const CollectionUtil();

  static int compareToNullable<T extends Comparable>(T? a, T? b) {
    if (a == null) {
      return 1;
    }
    if (b == null) {
      return -1;
    }
    return a.compareTo(b);
  }

  /// Find the difference between the two lists [first] and [second]
  /// Results are passed as callbacks back to the caller during the comparison
  static FutureOr<bool> diffLists<T>(
    List<T> first,
    List<T> second, {
    required int Function(T a, T b) compare,
    required FutureOr<bool> Function(T a, T b) both,
    required FutureOr<void> Function(T a) onlyFirst,
    required FutureOr<void> Function(T b) onlySecond,
  }) async {
    first.sort(compare);
    first.uniqueConsecutive(compare);
    second.sort(compare);
    second.uniqueConsecutive(compare);

    bool diff = false;
    int i = 0, j = 0;

    for (; i < first.length && j < second.length;) {
      final int order = compare(first[i], second[j]);
      if (order == 0) {
        diff |= await both(first[i++], second[j++]);
      } else if (order < 0) {
        await onlyFirst(first[i++]);
        diff = true;
      } else if (order > 0) {
        await onlySecond(second[j++]);
        diff = true;
      }
    }

    diff |= i < first.length || j < second.length;

    for (; i < first.length; i++) {
      onlyFirst(first[i]);
    }
    for (; j < second.length; j++) {
      onlySecond(second[j]);
    }
    return diff;
  }
}

extension _ListExtension<T> on List<T> {
  List<T> uniqueConsecutive(int Function(T a, T b) compare) {
    int i = 1, j = 1;
    for (; i < length; i++) {
      if (compare(this[i - 1], this[i]) != 0) {
        if (i != j) {
          this[j] = this[i];
        }
        j++;
      }
    }
    length = length == 0 ? 0 : j;
    return this;
  }
}
