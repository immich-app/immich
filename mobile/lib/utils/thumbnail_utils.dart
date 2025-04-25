import 'package:easy_localization/easy_localization.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/domain/models/exif.model.dart';

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

/*
  "image_alt_text_date": "{isVideo, select, true {Video} other {Image}} taken on {date}",
  "image_alt_text_date_1_person": "{isVideo, select, true {Video} other {Image}} taken with {person1} on {date}",
  "image_alt_text_date_2_people": "{isVideo, select, true {Video} other {Image}} taken with {person1} and {person2} on {date}",
  "image_alt_text_date_3_people": "{isVideo, select, true {Video} other {Image}} taken with {person1}, {person2}, and {person3} on {date}",
  "image_alt_text_date_4_or_more_people": "{isVideo, select, true {Video} other {Image}} taken with {person1}, {person2}, and {additionalCount, number} others on {date}",
  "image_alt_text_date_place": "{isVideo, select, true {Video} other {Image}} taken in {city}, {country} on {date}",
  "image_alt_text_date_place_1_person": "{isVideo, select, true {Video} other {Image}} taken in {city}, {country} with {person1} on {date}",
  "image_alt_text_date_place_2_people": "{isVideo, select, true {Video} other {Image}} taken in {city}, {country} with {person1} and {person2} on {date}",
  "image_alt_text_date_place_3_people": "{isVideo, select, true {Video} other {Image}} taken in {city}, {country} with {person1}, {person2}, and {person3} on {date}",
  "image_alt_text_date_place_4_or_more_people": "{isVideo, select, true {Video} other {Image}} taken in {city}, {country} with {person1}, {person2}, and {additionalCount, number} others on {date}",

 */
