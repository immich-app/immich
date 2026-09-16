import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/value_codec.dart';

enum _Fruit { apple, banana, cherry }

void main() {
  group('MapCodec', () {
    group('encode', () {
      test('serializes an empty map to an empty JSON object', () {
        const codec = MapCodec<String, String>(PrimitiveCodec.string, PrimitiveCodec.string);
        expect(codec.encode({}), '{}');
      });

      test('encodes a string-to-string map as a JSON object', () {
        const codec = MapCodec<String, String>(PrimitiveCodec.string, PrimitiveCodec.string);
        expect(codec.encode({'a': '1', 'b': '2'}), '{"a":"1","b":"2"}');
      });

      test('stringifies non-string values via the value codec', () {
        const codec = MapCodec<String, int>(PrimitiveCodec.string, PrimitiveCodec.integer);
        expect(codec.encode({'x': 10, 'y': 20}), '{"x":"10","y":"20"}');
      });

      test('stringifies non-string keys via the key codec', () {
        const codec = MapCodec<int, String>(PrimitiveCodec.integer, PrimitiveCodec.string);
        expect(codec.encode({1: 'one', 2: 'two'}), '{"1":"one","2":"two"}');
      });
    });

    group('decode', () {
      test('reconstructs a string-to-string map', () {
        const codec = MapCodec<String, String>(PrimitiveCodec.string, PrimitiveCodec.string);
        expect(codec.decode('{"a":"1","b":"2"}'), {'a': '1', 'b': '2'});
      });

      test('parses values back to their domain type', () {
        const codec = MapCodec<String, int>(PrimitiveCodec.string, PrimitiveCodec.integer);
        expect(codec.decode('{"x":"10","y":"20"}'), {'x': 10, 'y': 20});
      });

      test('parses keys back to their domain type', () {
        const codec = MapCodec<int, String>(PrimitiveCodec.integer, PrimitiveCodec.string);
        expect(codec.decode('{"1":"one","2":"two"}'), {1: 'one', 2: 'two'});
      });

      test('returns an empty map for an empty JSON object', () {
        const codec = MapCodec<String, String>(PrimitiveCodec.string, PrimitiveCodec.string);
        expect(codec.decode('{}'), isEmpty);
      });

      test('returns an empty map when the payload is not valid JSON', () {
        const codec = MapCodec<String, String>(PrimitiveCodec.string, PrimitiveCodec.string);
        expect(codec.decode('not json'), isEmpty);
      });

      test('returns an empty map when the JSON root is not an object', () {
        const codec = MapCodec<String, String>(PrimitiveCodec.string, PrimitiveCodec.string);
        expect(codec.decode('[]'), isEmpty);
        expect(codec.decode('"a string"'), isEmpty);
        expect(codec.decode('42'), isEmpty);
      });

      test('skips entries whose value is not a JSON string, keeping the rest', () {
        const codec = MapCodec<String, int>(PrimitiveCodec.string, PrimitiveCodec.integer);
        expect(codec.decode('{"x":1,"y":"20"}'), {'y': 20});
      });

      test('skips entries whose value is a nested object, keeping the rest', () {
        const codec = MapCodec<String, String>(PrimitiveCodec.string, PrimitiveCodec.string);
        expect(codec.decode('{"a":{"nested":"value"},"b":"ok"}'), {'b': 'ok'});
      });

      test('returns an empty map when every entry is malformed', () {
        const codec = MapCodec<String, int>(PrimitiveCodec.string, PrimitiveCodec.integer);
        expect(codec.decode('{"x":1,"y":2}'), isEmpty);
      });
    });

    group('round trip', () {
      test('preserves a primitive map through encode then decode', () {
        const codec = MapCodec<String, int>(PrimitiveCodec.string, PrimitiveCodec.integer);
        const original = {'one': 1, 'two': 2, 'three': 3};
        expect(codec.decode(codec.encode(original)), original);
      });

      test('preserves an enum-valued map by composing with EnumCodec', () {
        const codec = MapCodec<String, _Fruit>(PrimitiveCodec.string, EnumCodec(_Fruit.values));
        const original = {'breakfast': _Fruit.banana, 'snack': _Fruit.apple};
        expect(codec.decode(codec.encode(original)), original);
      });

      test('preserves a DateTime-valued map by composing with DateTimeCodec', () {
        const codec = MapCodec<String, DateTime>(PrimitiveCodec.string, DateTimeCodec());
        final original = {'created': DateTime.utc(2024, 1, 1, 12, 30)};
        expect(codec.decode(codec.encode(original)), original);
      });
    });
  });
}
