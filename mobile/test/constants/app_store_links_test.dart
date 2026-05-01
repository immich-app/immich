import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/constants/constants.dart';

void main() {
  test('iOS client update link points to the Noodle Gallery App Store listing', () {
    expect(kImmichAppStoreLink, 'https://apps.apple.com/app/id6761776289');
  });

  test('Android client update link points to the Noodle Gallery Play Store listing', () {
    expect(kImmichPlayStoreLink, 'https://play.google.com/store/apps/details?id=de.opennoodle.gallery');
  });
}
