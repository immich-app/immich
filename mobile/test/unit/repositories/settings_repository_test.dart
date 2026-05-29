import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/config/app_config.dart';
import 'package:immich_mobile/domain/models/settings_key.dart';

void main() {
  group('SettingsKey', () {
    for (final key in SettingsKey.values) {
      test('verify codec for $key', () {
        final defaultValue = defaultConfig.read(key);
        final encoded = key.encode(defaultValue);
        final decoded = key.decode(encoded);
        expect(decoded, defaultValue, reason: 'round-trip failed for ${key.name}');
      });
    }
  });
}
