import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/constants/enums.dart';
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

  group('AppConfig', () {
    test('trash sync defaults to off', () {
      expect(const AppConfig().trashSync.mode, TrashSyncMode.off);
    });

    test('writes trash sync mode through settings key', () {
      final config = const AppConfig().write(SettingsKey.trashSyncMode, TrashSyncMode.review);
      expect(config.trashSync.mode, TrashSyncMode.review);
    });
  });
}
