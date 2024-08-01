import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/exif_info.entity.dart';
import 'package:immich_mobile/utils/thumbnail_util.dart';

void main() {
  test('returns description if it has one', () {
    String result = getAltText(
      ExifInfo(description: 'description'),
      DateTime.now(),
      AssetType.image,
    );
    expect(result, 'description');
  });

  test('returns image alt text with date if no location', () {
    String result = getAltText(
      ExifInfo(country: 'country'),
      DateTime.now(),
      AssetType.image,
    );
    expect(result, "image_alt_text_date");
  });

  test('returns video alt text with date if no location', () {
    String result = getAltText(
      ExifInfo(city: 'city'),
      DateTime.now(),
      AssetType.video,
    );
    expect(result, "video_alt_text_date");
  });

  test('returns image alt text with date and place if location', () {
    String result = getAltText(
      ExifInfo(city: 'city', country: 'country'),
      DateTime.now(),
      AssetType.image,
    );
    expect(result, "image_alt_text_date_place");
  });

  test('returns video alt text with date and place if location', () {
    String result = getAltText(
      ExifInfo(city: 'city', country: 'country'),
      DateTime.now(),
      AssetType.video,
    );
    expect(result, "video_alt_text_date_place");
  });
}
