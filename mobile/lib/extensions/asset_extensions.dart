import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/utils/timezone.dart';

extension TZExtension on Asset {
  /// Returns the created time of the asset from the exif info (if available) or from
  /// the fileCreatedAt field, adjusted to the timezone value from the exif info along with
  /// the timezone offset in [Duration]
  (DateTime, Duration) getTZAdjustedTimeAndOffset() {
    DateTime dt = fileCreatedAt.toLocal();

    if (exifInfo?.dateTimeOriginal != null) {
      return applyTimezoneOffset(dateTime: exifInfo!.dateTimeOriginal!, timeZone: exifInfo?.timeZone);
    }

    return (dt, dt.timeZoneOffset);
  }
}
