// ignore_for_file: avoid-unsafe-collection-methods

import 'dart:async';

abstract final class CollectionUtil {
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
    List<T> firstList,
    List<T> secondList, {
    required int Function(T a, T b) compare,
    required FutureOr<bool> Function(T a, T b) both,
    required FutureOr<void> Function(T a) onlyFirst,
    required FutureOr<void> Function(T b) onlySecond,
  }) async {
    final first =
        _uniqueConsecutive(List.of(firstList)..sort(compare), compare);
    final second =
        _uniqueConsecutive(List.of(secondList)..sort(compare), compare);

    bool diff = false;
    int i = 0, j = 0;

    while (i < first.length && j < second.length) {
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
      await onlyFirst(first[i]);
    }
    for (; j < second.length; j++) {
      await onlySecond(second[j]);
    }
    return diff;
  }
}

List<T> _uniqueConsecutive<T>(List<T> list, int Function(T a, T b) compare) {
  if (list.isEmpty) return list;

  List<T> unique = [];
  unique.add(list.first);

  for (int i = 1; i < list.length; i++) {
    if (compare(list[i], list[i - 1]) != 0) {
      unique.add(list[i]);
    }
  }
  return unique;
}
