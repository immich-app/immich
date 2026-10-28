import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/utils/camera.utils.dart';

void main() {
  group('getCameraName', () {
    test('does not repeat the make when the model already starts with it', () {
      expect(getCameraName('Canon', 'Canon EOS R6m2'), 'Canon EOS R6m2');
      expect(getCameraName('Canon', 'Canon EOS 5D Mark IV'), 'Canon EOS 5D Mark IV');
    });

    test('compares the make and model case-insensitively', () {
      expect(getCameraName('NIKON', 'Nikon Z 6'), 'Nikon Z 6');
      expect(getCameraName('canon', 'CANON EOS R5'), 'CANON EOS R5');
    });

    test('compares against the first word of a multi-word make', () {
      expect(getCameraName('NIKON CORPORATION', 'NIKON D850'), 'NIKON D850');
      expect(getCameraName('OLYMPUS IMAGING CORP.', 'OLYMPUS E-M1'), 'OLYMPUS E-M1');
    });

    test('matches any word of a multi-word make', () {
      expect(getCameraName('EASTMAN KODAK COMPANY', 'KODAK EASYSHARE C875'), 'KODAK EASYSHARE C875');
      expect(getCameraName('EASTMAN KODAK COMPANY', 'EASTMAN KODAK 1'), 'EASTMAN KODAK 1');
    });

    test('prepends the make when the model does not include it', () {
      expect(getCameraName('SONY', 'ILCE-7M4'), 'SONY ILCE-7M4');
      expect(getCameraName('FUJIFILM', 'X-T5'), 'FUJIFILM X-T5');
      expect(getCameraName('Apple', 'iPhone 15 Pro'), 'Apple iPhone 15 Pro');
    });

    test('only treats the make as a prefix on a word boundary', () {
      expect(getCameraName('Canon', 'Canonical X1'), 'Canon Canonical X1');
    });

    test('handles a missing make or model', () {
      expect(getCameraName('Canon', null), 'Canon');
      expect(getCameraName(null, 'EOS R6m2'), 'EOS R6m2');
      expect(getCameraName(null, null), isNull);
      expect(getCameraName('', ''), isNull);
    });

    test('ignores surrounding whitespace', () {
      expect(getCameraName(' Canon ', ' Canon EOS R6m2 '), 'Canon EOS R6m2');
    });
  });
}
