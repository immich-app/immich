import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/constants/adjustments.dart';

void main() {
  group('AdjustValues', () {
    test('defaults to zero for all fields', () {
      const v = AdjustValues();
      expect(v.brightness, 0);
      expect(v.contrast, 0);
      expect(v.saturation, 0);
      expect(v.warmth, 0);
      expect(v.sharpness, 0);
    });

    test('hasChanges is false when all values are zero', () {
      const v = AdjustValues();
      expect(v.hasChanges, isFalse);
    });

    test('hasChanges is true when any value is non-zero', () {
      expect(const AdjustValues(brightness: 1).hasChanges, isTrue);
      expect(const AdjustValues(contrast: -1).hasChanges, isTrue);
      expect(const AdjustValues(saturation: 50).hasChanges, isTrue);
      expect(const AdjustValues(warmth: -50).hasChanges, isTrue);
      expect(const AdjustValues(sharpness: 10).hasChanges, isTrue);
    });
  });

  group('adjustPresets', () {
    test('first preset is the original (identity) preset', () {
      final original = adjustPresets.first;
      expect(original.labelKey, 'adjust_preset_original');
      expect(original.values.hasChanges, isFalse);
    });

    test('all presets have unique label keys', () {
      final keys = adjustPresets.map((p) => p.labelKey).toList();
      expect(keys.toSet().length, keys.length);
    });

    test('all preset label keys follow naming convention', () {
      for (final preset in adjustPresets) {
        expect(preset.labelKey, startsWith('adjust_preset_'));
      }
    });

    test('contains expected number of presets', () {
      expect(adjustPresets.length, 10);
    });
  });

  group('autoEnhanceValues', () {
    test('has changes', () {
      expect(autoEnhanceValues.hasChanges, isTrue);
    });

    test('all values are positive (enhancing)', () {
      expect(autoEnhanceValues.brightness, greaterThan(0));
      expect(autoEnhanceValues.contrast, greaterThan(0));
      expect(autoEnhanceValues.saturation, greaterThan(0));
      expect(autoEnhanceValues.warmth, greaterThan(0));
      expect(autoEnhanceValues.sharpness, greaterThan(0));
    });
  });

  group('adjustValuesToColorFilter', () {
    test('identity values produce identity matrix', () {
      final filter = adjustValuesToColorFilter(const AdjustValues());
      // Identity matrix should produce a ColorFilter
      expect(filter, isA<ColorFilter>());
    });

    test('brightness-only values produce a valid filter', () {
      final filter = adjustValuesToColorFilter(const AdjustValues(brightness: 50));
      expect(filter, isA<ColorFilter>());
    });

    test('extreme values produce a valid filter without throwing', () {
      final filter = adjustValuesToColorFilter(
        const AdjustValues(brightness: 100, contrast: 100, saturation: 100, warmth: 100, sharpness: 100),
      );
      expect(filter, isA<ColorFilter>());
    });

    test('negative extreme values produce a valid filter', () {
      final filter = adjustValuesToColorFilter(
        const AdjustValues(brightness: -100, contrast: -100, saturation: -100, warmth: -100, sharpness: -100),
      );
      expect(filter, isA<ColorFilter>());
    });

    test('all presets produce valid filters', () {
      for (final preset in adjustPresets) {
        expect(adjustValuesToColorFilter(preset.values), isA<ColorFilter>());
      }
    });

    test('auto-enhance produces a valid filter', () {
      expect(adjustValuesToColorFilter(autoEnhanceValues), isA<ColorFilter>());
    });
  });
}
