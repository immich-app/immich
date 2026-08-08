import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/utils/mime.utils.dart';

void main() {
  group('isUnsupportedMimeError', () {
    PlatformException err(Object? details) => PlatformException(code: 'saveImageWithPath', details: details);

    test('detects the MediaStore unsupported-mime failure', () {
      expect(isUnsupportedMimeError(err('java.lang.IllegalArgumentException: Unsupported MIME type image/*')), isTrue);
    });

    test('is case-insensitive', () {
      expect(isUnsupportedMimeError(err('unsupported mime type foo')), isTrue);
    });

    test('ignores other Unsupported* errors', () {
      expect(isUnsupportedMimeError(err('java.lang.UnsupportedOperationException')), isFalse);
    });

    test('ignores unrelated failures and non-string details', () {
      expect(isUnsupportedMimeError(err('Permission denied')), isFalse);
      expect(isUnsupportedMimeError(err(null)), isFalse);
      expect(isUnsupportedMimeError(err(42)), isFalse);
    });
  });
}
