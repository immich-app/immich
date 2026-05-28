import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/config/app_config.dart';
import 'package:immich_mobile/domain/models/metadata_key.dart';

void main() {
  group('MetadataKey', () {
    for (final key in MetadataKey.values) {
      test('verify codec for $key', () {
        final defaultValue = defaultConfig.read(key);
        final encoded = key.encode(defaultValue);
        final decoded = key.decode(encoded);
        expect(decoded, defaultValue, reason: 'round-trip failed for ${key.name}');
      });
    }
  });
}
