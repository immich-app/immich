const int _maxMillisecondsSinceEpoch = 8640000000000000; // 275760-09-13
const int _minMillisecondsSinceEpoch = -62135596800000; // 0001-01-01

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

// no DateFormat: it tracks Intl.defaultLocale and needs locale init per isolate
String timelineGroupDate(DateTime value) =>
    '${value.year.toString().padLeft(4, '0')}-${value.month.toString().padLeft(2, '0')}-${value.day.toString().padLeft(2, '0')}';
