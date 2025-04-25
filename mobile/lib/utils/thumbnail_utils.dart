import 'package:easy_localization/easy_localization.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/domain/models/exif.model.dart';

String getAltText(
  ExifInfo? exifInfo,
  DateTime fileCreatedAt,
  AssetType type,
  List<String> peopleNames,
) {
  if (exifInfo?.description != null && exifInfo!.description!.isNotEmpty) {
    return exifInfo.description!;
  }
  final (template, args) =
      getAltTextTemplate(exifInfo, fileCreatedAt, type, peopleNames);
  return template.tr(namedArgs: args);
}

(String, Map<String, String>) getAltTextTemplate(
  ExifInfo? exifInfo,
  DateTime fileCreatedAt,
  AssetType type,
  List<String> peopleNames,
) {
  final isVideo = type == AssetType.video;
  final hasLocation = exifInfo?.city != null && exifInfo?.country != null;
  final date = DateFormat.yMMMMd().format(fileCreatedAt);
  final args = {
    "isVideo": isVideo.toString(),
    "date": date,
    "city": exifInfo?.city ?? "",
    "country": exifInfo?.country ?? "",
    "person1": peopleNames.elementAtOrNull(0) ?? "",
    "person2": peopleNames.elementAtOrNull(1) ?? "",
    "person3": peopleNames.elementAtOrNull(2) ?? "",
    "additionalCount": (peopleNames.length - 3).toString(),
  };
  final template = hasLocation
      ? (switch (peopleNames.length) {
          0 => "image_alt_text_date_place",
          1 => "image_alt_text_date_place_1_person",
          2 => "image_alt_text_date_place_2_people",
          3 => "image_alt_text_date_place_3_people",
          _ => "image_alt_text_date_place_4_or_more_people"
        })
      : (switch (peopleNames.length) {
          0 => "image_alt_text_date",
          1 => "image_alt_text_date_1_person",
          2 => "image_alt_text_date_2_people",
          3 => "image_alt_text_date_3_people",
          _ => "image_alt_text_date_4_or_more_people"
        });
  return (template, args);
}
