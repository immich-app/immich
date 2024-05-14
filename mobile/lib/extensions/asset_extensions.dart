import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:timezone/timezone.dart';

extension TZExtension on Asset {
  /// Returns the created time of the asset from the exif info (if available) or from
  /// the fileCreatedAt field, adjusted to the timezone value from the exif info along with
  /// the timezone offset in [Duration]
  (DateTime, Duration) getTZAdjustedTimeAndOffset() {
    DateTime dt = fileCreatedAt.toLocal();
    if (exifInfo?.dateTimeOriginal != null) {
      dt = exifInfo!.dateTimeOriginal!;
      if (exifInfo?.timeZone != null) {
        dt = dt.toUtc();
        try {
          final location = getLocation(exifInfo!.timeZone!);
          dt = TZDateTime.from(dt, location);
        } on LocationNotFoundException {
          RegExp re = RegExp(
            r'^utc(?:([+-]\d{1,2})(?::(\d{2}))?)?$',
            caseSensitive: false,
          );
          final m = re.firstMatch(exifInfo!.timeZone!);
          if (m != null) {
            final duration = Duration(
              hours: int.parse(m.group(1) ?? '0'),
              minutes: int.parse(m.group(2) ?? '0'),
            );
            dt = dt.add(duration);
            return (dt, duration);
          }
        }
      }
    }
    return (dt, dt.timeZoneOffset);
  }
}
