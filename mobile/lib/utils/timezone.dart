import 'package:timezone/timezone.dart';

/// Applies timezone conversion to a DateTime using EXIF timezone information.
///
/// This function handles two timezone formats:
/// 1. Named timezone locations (e.g., "Asia/Hong_Kong")
/// 2. UTC offset format (e.g., "UTC+08:00", "UTC-05:00")
///
/// Returns a tuple of (adjusted DateTime, timezone offset Duration)
(DateTime, Duration) applyTimezoneOffset({required DateTime dateTime, required String? timeZone}) {
  DateTime dt = dateTime.toUtc();

  if (timeZone == null) {
    return (dt, dt.timeZoneOffset);
  }

  try {
    // Try to get timezone location from database
    final location = getLocation(timeZone);
    dt = TZDateTime.from(dt, location);
    return (dt, dt.timeZoneOffset);
  } on LocationNotFoundException {
    // Handle UTC offset format (e.g., "UTC+08:00")
    RegExp re = RegExp(r'^utc(?:([+-]\d{1,2})(?::(\d{2}))?)?$', caseSensitive: false);
    final m = re.firstMatch(timeZone);
    if (m != null) {
      final duration = Duration(hours: int.parse(m.group(1) ?? '0'), minutes: int.parse(m.group(2) ?? '0'));
      dt = dt.add(duration);
      return (dt, duration);
    }
  }

  // If timezone is invalid, return UTC
  return (dt, dt.timeZoneOffset);
}
