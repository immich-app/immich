import 'dart:async';

/// Efficiently compares two sorted lists in O(n), calling the given callback
/// for each item.
/// Return `true` if there are any differences found, else `false`
Future<bool> diffSortedLists<A, B>(
  List<A> la,
  List<B> lb, {
  required int Function(A a, B b) compare,
  required FutureOr<bool> Function(A a, B b) both,
  required FutureOr<void> Function(A a) onlyFirst,
  required FutureOr<void> Function(B b) onlySecond,
}) async {
  bool diff = false;
  int i = 0, j = 0;
  for (; i < la.length && j < lb.length;) {
    final int order = compare(la[i], lb[j]);
    if (order == 0) {
      diff |= await both(la[i++], lb[j++]);
    } else if (order < 0) {
      await onlyFirst(la[i++]);
      diff = true;
    } else if (order > 0) {
      await onlySecond(lb[j++]);
      diff = true;
    }
  }
  diff |= i < la.length || j < lb.length;
  for (; i < la.length; i++) {
    await onlyFirst(la[i]);
  }
  for (; j < lb.length; j++) {
    await onlySecond(lb[j]);
  }
  return diff;
}

/// Efficiently compares two sorted lists in O(n), calling the given callback
/// for each item.
/// Return `true` if there are any differences found, else `false`
bool diffSortedListsSync<A, B>(
  List<A> la,
  List<B> lb, {
  required int Function(A a, B b) compare,
  required bool Function(A a, B b) both,
  required void Function(A a) onlyFirst,
  required void Function(B b) onlySecond,
}) {
  bool diff = false;
  int i = 0, j = 0;
  for (; i < la.length && j < lb.length;) {
    final int order = compare(la[i], lb[j]);
    if (order == 0) {
      diff |= both(la[i++], lb[j++]);
    } else if (order < 0) {
      onlyFirst(la[i++]);
      diff = true;
    } else if (order > 0) {
      onlySecond(lb[j++]);
      diff = true;
    }
  }
  diff |= i < la.length || j < lb.length;
  for (; i < la.length; i++) {
    onlyFirst(la[i]);
  }
  for (; j < lb.length; j++) {
    onlySecond(lb[j]);
  }
  return diff;
}
