import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/exif.model.dart';
import 'package:timezone/timezone.dart';

(DateTime, Duration) getTZAdjustedTimeAndOffset(BaseAsset asset, ExifInfo? exifInfo) {
  DateTime dt = asset.createdAt.toLocal();
  if (exifInfo?.dateTimeOriginal != null) {
    dt = exifInfo!.dateTimeOriginal!;
    if (exifInfo.timeZone != null) {
      dt = dt.toUtc();
      try {
        final location = getLocation(exifInfo.timeZone!);
        dt = TZDateTime.from(dt, location);
      } on LocationNotFoundException {
        RegExp re = RegExp(r'^utc(?:([+-]\d{1,2})(?::(\d{2}))?)?$', caseSensitive: false);
        final m = re.firstMatch(exifInfo.timeZone!);
        if (m != null) {
          final duration = Duration(hours: int.parse(m.group(1) ?? '0'), minutes: int.parse(m.group(2) ?? '0'));
          dt = dt.add(duration);
          return (dt, duration);
        }
      }
    }
  }

  return (dt, dt.timeZoneOffset);
}
