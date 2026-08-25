import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/exif.model.dart';
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
    final RegExp re = RegExp(r'^utc(?:([+-]\d{1,2})(?::(\d{2}))?)?$', caseSensitive: false);
    final m = re.firstMatch(timeZone);
    if (m != null) {
      final hours = int.parse(m.group(1) ?? '0');
      final minutes = int.parse(m.group(2) ?? '0');
      final duration = Duration(hours: hours, minutes: hours.isNegative ? -minutes : minutes);
      dt = dt.add(duration);
      return (dt, duration);
    }
  }

  // If timezone is invalid, return UTC
  return (dt, dt.timeZoneOffset);
}

/// Resolves the effective local [DateTime] (and its timezone offset) for an asset.
///
/// Prefers the EXIF `dateTimeOriginal` with its timezone when available,
/// otherwise falls back to the asset's [BaseAsset.createdAt] in local time.
///
/// Returns a tuple of (resolved DateTime, timezone offset Duration).
(DateTime, Duration) resolveAssetDateTime(BaseAsset asset, ExifInfo? exifInfo) {
  if (exifInfo?.dateTimeOriginal == null) {
    final dateTime = asset.createdAt.toLocal();
    return (dateTime, dateTime.timeZoneOffset);
  }

  return applyTimezoneOffset(dateTime: exifInfo!.dateTimeOriginal!, timeZone: exifInfo.timeZone);
}
