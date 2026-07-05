import 'dart:math';

import 'package:uuid/uuid.dart';

class TestUtils {
  static final _random = Random();

  static String uuid([String? id]) => id ?? const Uuid().v4();

  static DateTime date([DateTime? date]) => date ?? DateTime.now();
  static DateTime now() => DateTime.now();
  static DateTime yesterday() => DateTime.now().subtract(const Duration(days: 1));
  static DateTime tomorrow() => DateTime.now().add(const Duration(days: 1));

  static T randElement<T>(List<T> list) => list[_random.nextInt(list.length)];
  static int randInt([int? max]) => max != null ? _random.nextInt(max) : _random.nextInt(1 << 32);
  static double randDouble([int? max, int? min]) {
    final minValue = min ?? 0;
    final maxValue = max ?? 1;
    return minValue + _random.nextDouble() * (maxValue - minValue);
  }
}
