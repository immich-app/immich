// ignore_for_file: avoid-unsafe-collection-methods

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

  /// Find the difference between the two sorted lists [first] and [second]
  /// Results are passed as callbacks back to the caller during the comparison
  static bool diffSortedLists<T>(
    List<T> first,
    List<T> second, {
    required Comparator<T> compare,
    required bool Function(T a, T b) both,
    required void Function(T a) onlyFirst,
    required void Function(T b) onlySecond,
  }) {
    bool diff = false;
    int i = 0, j = 0;

    for (; i < first.length && j < second.length;) {
      final int order = compare(first[i], second[j]);
      if (order == 0) {
        diff |= both(first[i++], second[j++]);
      } else if (order < 0) {
        onlyFirst(first[i++]);
        diff = true;
      } else if (order > 0) {
        onlySecond(second[j++]);
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
