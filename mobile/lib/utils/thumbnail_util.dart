import 'package:easy_localization/easy_localization.dart';
import 'package:immich_mobile/entities/exif_info.entity.dart';

String getAltText(ExifInfo? exifInfo, DateTime fileCreatedAt) {
  if (exifInfo?.description != null && exifInfo!.description!.isNotEmpty) {
    return exifInfo.description!;
  }

  bool hasLocation = exifInfo?.city != null && exifInfo?.country != null;
  String date = DateFormat.yMMMMd().format(fileCreatedAt);

  if (hasLocation) {
    String location = '${exifInfo!.city}, ${exifInfo.country}';
    return 'thumbnail_alt_text_date_and_location'.tr(args: [location, date]);
  }

  return 'thumbnail_alt_text_date'.tr(args: [date]);
}
