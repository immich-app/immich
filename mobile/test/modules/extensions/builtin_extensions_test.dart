import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/extensions/string_extensions.dart';

void main() {
  group('Test toDuration', () {
    test('ok', () {
      expect("1:02:33".toDuration(), const Duration(hours: 1, minutes: 2, seconds: 33));
    });
    test('fractional seconds', () {
      expect("0:00:00.500000".toDuration(), const Duration(milliseconds: 500));
      expect("0:00:01.250000".toDuration(), const Duration(seconds: 1, milliseconds: 250));
      expect("1:02:33.123456".toDuration(), const Duration(hours: 1, minutes: 2, seconds: 33, milliseconds: 123));
    });
    test('malformed', () {
      expect("".toDuration(), isNull);
      expect("1:2".toDuration(), isNull);
      expect("a:b:c".toDuration(), isNull);
    });
  });
  group('Test removeDiacritics', () {
    test('removes acute accents', () {
      expect('Amélie'.removeDiacritics(), 'Amelie');
    });

    test('removes grave accents', () {
      expect('À la carte'.removeDiacritics(), 'A la carte');
    });

    test('removes circumflex', () {
      expect('hôpital'.removeDiacritics(), 'hopital');
    });

    test('removes tilde', () {
      expect('São João'.removeDiacritics(), 'Sao Joao');
    });

    test('removes diaeresis', () => expect('naïve'.removeDiacritics(), 'naive'));

    test('removes cedilla', () => expect('ça va'.removeDiacritics(), 'ca va'));

    test('handles Hungarian exteded characters (ű/ő)', () {
      expect('árvíztűrő tükörfúrógép'.removeDiacritics(), 'arvizturo tukorfurogep');
    });

    test('handles Polish characters', () {
      expect('Jędrzej Łącki'.removeDiacritics(), 'Jedrzej Lacki');
    });

    test('handles German umlauts', () => expect('Müller'.removeDiacritics(), 'Muller'));

    test('handles Nordic characters', () => expect('Göteborg'.removeDiacritics(), 'Goteborg'));

    test('handles empty string', () => expect(''.removeDiacritics(), ''));

    test('handles string with no diacritics', () {
      expect('hello world'.removeDiacritics(), 'hello world');
    });

    test('handles Ñ/ñ', () => expect('Niño'.removeDiacritics(), 'Nino'));

    test('diacritic removal is order-independent', () {
      const raw = 'Árvíztűrő';
      expect(raw.toLowerCase().removeDiacritics(), raw.removeDiacritics().toLowerCase());
    });
  });
}
