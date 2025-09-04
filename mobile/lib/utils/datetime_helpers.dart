const int _maxMillisecondsSinceEpoch = 8640000000000000; // 275760-09-13
const int _minMillisecondsSinceEpoch = -62135596800000; // 0001-01-01

DateTime? tryFromSecondsSinceEpoch(int? secondsSinceEpoch) {
  if (secondsSinceEpoch == null) {
    return null;
  }

  final milliSeconds = secondsSinceEpoch * 1000;
  if (milliSeconds < _minMillisecondsSinceEpoch || milliSeconds > _maxMillisecondsSinceEpoch) {
    return null;
  }

  try {
    return DateTime.fromMillisecondsSinceEpoch(milliSeconds);
  } catch (e) {
    return null;
  }
}
