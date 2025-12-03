import 'dart:math' as math;

extension DoubleTruncate on double {
  double truncateTo(int fractionDigits) {
    final mod = math.pow(10.0, fractionDigits);
    return ((this * mod).truncate() / mod);
  }
}
