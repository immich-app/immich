import 'package:uuid/uuid.dart';

class TestUtils {
  static String uuid([String? id]) => id ?? const Uuid().v4();

  static DateTime date([DateTime? date]) => date ?? DateTime.now();
  static DateTime now() => DateTime.now();
  static DateTime yesterday() => DateTime.now().subtract(const Duration(days: 1));
  static DateTime tomorrow() => DateTime.now().add(const Duration(days: 1));
}
