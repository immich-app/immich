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

// Uses the held components, so convert with toLocal() first for instants.
// Dates sqlite cannot read (year outside 1..9999) fall to null instead of a mangled day
String? timelineGroupDate(DateTime value) {
  if (value.year < 1 || value.year > 9999) {
    return null;
  }
  return value.toIso8601String().split('T').first;
}

// 'UTC+14:00' style, from the date picker path
Duration? tryParseUtcOffset(String? value) {
  final match = value == null ? null : RegExp(r'^UTC([+-])(\d{2}):(\d{2})$').firstMatch(value);
  if (match == null) {
    return null;
  }
  final minutes = int.parse(match[2]!) * 60 + int.parse(match[3]!);
  return Duration(minutes: match[1] == '-' ? -minutes : minutes);
}

// group_date for remote rows: wall day when known, else the local day of createdAt
String? remoteGroupDate(DateTime? localDateTime, DateTime createdAt) =>
    (localDateTime != null ? timelineGroupDate(localDateTime) : null) ?? timelineGroupDate(createdAt.toLocal());
