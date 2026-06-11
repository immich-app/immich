import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/config/app_config.dart';
import 'package:immich_mobile/domain/models/settings_key.dart';

void main() {
  group('SettingsKey', () {
    for (final key in SettingsKey.values) {
      final defaultValue = defaultConfig.read(key);
      // null is a valid value for some keys but we don't use the codec in that case
      if (defaultValue == null) {
        continue;
      }
      test('verify codec for $key', () {
        final encoded = key.encode(defaultValue);
        final decoded = key.decode(encoded);
        expect(decoded, defaultValue, reason: 'round-trip failed for ${key.name}');
      });
    }
  });

  group('AppConfig.fromEntries', () {
    for (final key in SettingsKey.values) {
      test('routes the default value for $key through write/read', () {
        final value = defaultConfig.read(key);
        final config = AppConfig.fromEntries({key: value});
        expect(config.read(key), value, reason: 'write/read mismatch for ${key.name}');
      });
    }
  });
}
