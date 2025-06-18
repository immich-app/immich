import 'package:easy_localization/easy_localization.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/exif.model.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/utils/thumbnail_utils.dart';

void main() {
  final dateTime = DateTime(2025, 04, 25, 12, 13, 14);
  final dateTimeString = DateFormat.yMMMMd().format(dateTime);

  test('returns description if it has one', () {
    final result = getAltText(
      const ExifInfo(description: 'description'),
      dateTime,
      AssetType.image,
      [],
    );
    expect(result, 'description');
  });

  test('returns image alt text with date if no location', () {
    final (template, args) = getAltTextTemplate(
      const ExifInfo(),
      dateTime,
      AssetType.image,
      [],
    );
    expect(template, "image_alt_text_date");
    expect(args["isVideo"], "false");
    expect(args["date"], dateTimeString);
  });

  test('returns image alt text with date and place', () {
    final (template, args) = getAltTextTemplate(
      const ExifInfo(city: 'city', country: 'country'),
      dateTime,
      AssetType.video,
      [],
    );
    expect(template, "image_alt_text_date_place");
    expect(args["isVideo"], "true");
    expect(args["date"], dateTimeString);
    expect(args["city"], "city");
    expect(args["country"], "country");
  });

  test('returns image alt text with date and some people', () {
    final (template, args) = getAltTextTemplate(
      const ExifInfo(),
      dateTime,
      AssetType.image,
      ["Alice", "Bob"],
    );
    expect(template, "image_alt_text_date_2_people");
    expect(args["isVideo"], "false");
    expect(args["date"], dateTimeString);
    expect(args["person1"], "Alice");
    expect(args["person2"], "Bob");
  });

  test('returns image alt text with date and location and many people', () {
    final (template, args) = getAltTextTemplate(
      const ExifInfo(city: "city", country: 'country'),
      dateTime,
      AssetType.video,
      ["Alice", "Bob", "Carol", "David", "Eve"],
    );
    expect(template, "image_alt_text_date_place_4_or_more_people");
    expect(args["isVideo"], "true");
    expect(args["date"], dateTimeString);
    expect(args["city"], "city");
    expect(args["country"], "country");
    expect(args["person1"], "Alice");
    expect(args["person2"], "Bob");
    expect(args["person3"], "Carol");
    expect(args["additionalCount"], "2");
  });
}
