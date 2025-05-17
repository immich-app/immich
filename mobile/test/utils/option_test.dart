import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/utils/option.dart';

void main() {
  group('Option', () {
    test('should create a Some instance', () {
      const value = 42;
      final option = Option.some(value);
      expect(option, isA<Some<int>>());
      expect(option.isSome, isTrue);
      expect(option.isNone, isFalse);
    });

    test('Some instance should hold the correct value', () {
      const value = 'immich';
      final option = Option.some(value);
      expect(option.unwrapOrNull(), equals(value));
    });
  });

  test('should create a None instance', () {
    final option = Option<int>.none();
    expect(option, isA<None>());
    expect(option.isSome, isFalse);
    expect(option.isNone, isTrue);
  });

  test('None instance are equal', () {
    final option1 = Option<int>.none();
    final option2 = Option<int>.none();
    expect(option1, equals(option2));
  });

  group('Option.from', () {
    test('should create a Some instance for a non-null value', () {
      const value = 100.5;
      final option = Option.from(value);
      expect(option, isA<Some<double>>());
      expect(option.isSome, isTrue);
      expect(option.isNone, isFalse);
      expect(option.unwrapOrNull(), equals(value));
    });

    test('should create a None instance for a null value', () {
      final String? value = null;
      final option = Option.from(value);
      expect(option, isA<None>());
      expect(option.isSome, isFalse);
      expect(option.isNone, isTrue);
    });
  });

  group('unwrap()', () {
    test('should return the value for Some', () {
      const value = 'immich';
      final option = Option.some(value);
      expect(option.unwrap(), equals(value));
    });

    test('should throw StateError for None', () {
      final option = Option<int>.none();
      expect(() => option.unwrap(), throwsStateError);
    });
  });

  group('unwrapOrNull()', () {
    test('should return the value for Some', () {
      const value = 'test';
      final option = Option.some(value);
      expect(option.unwrapOrNull(), equals(value));
    });

    test('should return null for None', () {
      final option = Option<int>.none();
      expect(option.unwrapOrNull(), isNull);
    });
  });

  group('unwrapOr()', () {
    test('should return the value for Some', () {
      const value = true;
      const defaultValue = false;
      final option = Option.some(value);
      expect(option.unwrapOr(defaultValue), equals(value));
    });

    test('should return the default value for None', () {
      const defaultValue = 'immich';
      final option = Option<String>.none();
      expect(option.unwrapOr(defaultValue), equals(defaultValue));
    });
  });
}
