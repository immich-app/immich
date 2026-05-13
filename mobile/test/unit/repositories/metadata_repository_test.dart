import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/metadata_key.dart';

void main() {
  group('MetadataKey', () {
    test('every key round-trips its default value losslessly', () {
      for (final key in MetadataKey.values) {
        final encoded = key.encode(key.defaultValue);
        final decoded = key.decode(encoded);
        expect(decoded, key.defaultValue, reason: 'round-trip failed for ${key.name}');
      }
    });

    test('decode falls back to the default value when the raw input is unparseable', () {
      for (final key in MetadataKey.values) {
        expect(
          key.decode('not a valid encoding for any key'),
          key.defaultValue,
          reason: 'fallback failed for ${key.name}',
        );
      }
    });
  });
}
