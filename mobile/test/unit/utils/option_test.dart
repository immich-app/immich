import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/utils/option.dart';

void main() {
  group('Option', () {
    group('constructors', () {
      test('Option.some creates a Some instance', () {
        const option = Option.some(42);
        expect(option, isA<Some<int>>());
        expect((option as Some).value, 42);
      });

      test('Option.none creates a None instance', () {
        const option = Option<int>.none();
        expect(option, isA<None<int>>());
      });

      test('Option.fromNullable returns Some for non-null value', () {
        final option = Option.fromNullable('hello');
        expect(option, isA<Some<String>>());
        expect((option as Some).value, 'hello');
      });

      test('Option.fromNullable returns None for null value', () {
        final option = Option.fromNullable(null);
        expect(option, isA<None>());
      });
    });

    group('isSome / isNone', () {
      test('Some.isSome is true', () {
        expect(const Option.some(1).isSome, isTrue);
      });

      test('Some.isNone is false', () {
        expect(const Option.some(1).isNone, isFalse);
      });

      test('None.isSome is false', () {
        expect(const Option.none().isSome, isFalse);
      });

      test('None.isNone is true', () {
        expect(const Option.none().isNone, isTrue);
      });
    });

    group('unwrapOrNull', () {
      test('returns value for Some', () {
        expect(const Option.some('hi').unwrapOrNull, 'hi');
      });

      test('returns null for None', () {
        expect(const Option.none().unwrapOrNull, isNull);
      });
    });

    group('fold', () {
      test('calls onSome with value for Some', () {
        final result = const Option.some('world').fold((v) => 'some: $v', () => 'none');
        expect(result, 'some: world');
      });

      test('calls onNone for None', () {
        final result = const Option.none().fold((v) => 'some: $v', () => 'none');
        expect(result, 'none');
      });
    });

    group('equality', () {
      test('Some equals Some with same value', () {
        expect(const Option.some(1) == const Option.some(1), isTrue);
      });

      test('Some does not equal Some with different value', () {
        expect(const Option.some(1) == const Option.some(2), isFalse);
      });

      test('None equals None of same type', () {
        expect(const Option<int>.none() == const Option<int>.none(), isTrue);
      });

      test('None does not equal None of different type', () {
        expect(const Option<int>.none() == (const Option<String>.none() as Object), isFalse);
      });

      test('Some does not equal None', () {
        expect(const Option.some(0) == const Option.none(), isFalse);
      });
    });

    group('hashCode', () {
      test('Some hashCode equals value hashCode', () {
        expect(const Option.some('abc').hashCode, 'abc'.hashCode);
      });

      test('None hashCode is 0', () {
        expect(const Option.none().hashCode, 0);
      });
    });
  });

  group('ObjectOptionExtension', () {
    test('non-null value.toOption() returns Some', () {
      final option = 'hello'.toOption();
      expect(option, isA<Some<String>>());
      expect((option as Some).value, 'hello');
    });

    test('null value.toOption() returns None', () {
      const String? value = null;
      final option = value.toOption();
      expect(option, isA<None<String>>());
    });
  });
}
