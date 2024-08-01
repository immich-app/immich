import 'package:easy_localization/easy_localization.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/exif_info.entity.dart';

String getAltText(ExifInfo? exifInfo, DateTime fileCreatedAt, AssetType type) {
  if (exifInfo?.description != null && exifInfo!.description!.isNotEmpty) {
    return exifInfo.description!;
  }

  bool isVideo = type == AssetType.video;
  bool hasLocation = exifInfo?.city != null && exifInfo?.country != null;
  String date = DateFormat.yMMMMd().format(fileCreatedAt);

  if (hasLocation) {
    String location = '${exifInfo!.city}, ${exifInfo.country}';
    return isVideo
        ? 'video_alt_text_date_place'.tr(args: [location, date])
        : 'image_alt_text_date_place'.tr(args: [location, date]);
  }

  return isVideo
      ? 'video_alt_text_date'.tr(args: [date])
      : 'image_alt_text_date'.tr(args: [date]);
}
