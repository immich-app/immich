const int _maxMillisecondsSinceEpoch = 253402300799000; // 9999-12-31 (SQLite limit)
const int _minMillisecondsSinceEpoch = -62135596800000; // 0001-01-01 (Dart / SQLite limit)

DateTime? tryFromSecondsSinceEpoch(int? secondsSinceEpoch, {bool isUtc = false}) {
  if (secondsSinceEpoch == null) {
    return null;
  }

  final milliSeconds = secondsSinceEpoch * 1000;
  if (milliSeconds < _minMillisecondsSinceEpoch || milliSeconds > _maxMillisecondsSinceEpoch) {
    return null;
  }

  try {
    return DateTime.fromMillisecondsSinceEpoch(milliSeconds, isUtc: isUtc);
  } catch (e) {
    return null;
  }
}
