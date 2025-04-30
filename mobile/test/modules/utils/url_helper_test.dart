import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/utils/url_helper.dart';

void main() {
  group('punycodeEncodeUrl', () {
    test('should return empty string for invalid URL', () {
      expect(punycodeEncodeUrl('not a url'), equals(''));
    });

    test('should handle empty input', () {
      expect(punycodeEncodeUrl(''), equals(''));
    });

    test('should return ASCII-only URL unchanged', () {
      const url = 'https://example.com';
      expect(punycodeEncodeUrl(url), equals(url));
    });

    test('should encode single-segment Unicode host', () {
      const url = 'https://bücher';
      const expected = 'https://xn--bcher-kva';
      expect(punycodeEncodeUrl(url), equals(expected));
    });

    test('should encode multi-segment Unicode host', () {
      const url = 'https://bücher.de';
      const expected = 'https://xn--bcher-kva.de';
      expect(punycodeEncodeUrl(url), equals(expected));
    });

    test(
        'should encode multi-segment Unicode host with multiple non-ASCII segments',
        () {
      const url = 'https://bücher.münchen';
      const expected = 'https://xn--bcher-kva.xn--mnchen-3ya';
      expect(punycodeEncodeUrl(url), equals(expected));
    });

    test('should handle URL with port', () {
      const url = 'https://bücher.de:8080';
      const expected = 'https://xn--bcher-kva.de:8080';
      expect(punycodeEncodeUrl(url), equals(expected));
    });

    test('should handle URL with path', () {
      const url = 'https://bücher.de/path/to/resource';
      const expected = 'https://xn--bcher-kva.de/path/to/resource';
      expect(punycodeEncodeUrl(url), equals(expected));
    });

    test('should handle URL with port and path', () {
      const url = 'https://bücher.de:3000/path';
      const expected = 'https://xn--bcher-kva.de:3000/path';
      expect(punycodeEncodeUrl(url), equals(expected));
    });

    test('should not encode ASCII segment in multi-segment host', () {
      const url = 'https://shop.bücher.de';
      const expected = 'https://shop.xn--bcher-kva.de';
      expect(punycodeEncodeUrl(url), equals(expected));
    });

    test('should handle host with hyphen in Unicode segment', () {
      const url = 'https://bü-cher.de';
      const expected = 'https://xn--b-cher-3ya.de';
      expect(punycodeEncodeUrl(url), equals(expected));
    });

    test('should handle host with numbers in Unicode segment', () {
      const url = 'https://bücher123.de';
      const expected = 'https://xn--bcher123-65a.de';
      expect(punycodeEncodeUrl(url), equals(expected));
    });

    test('should encode the domain of the original issue poster :)', () {
      const url = 'https://фото.большойчлен.рф/';
      const expected = 'https://xn--n1aalg.xn--90ailhbncb6fh7b.xn--p1ai/';
      expect(punycodeEncodeUrl(url), expected);
    });
  });

  group('punycodeDecodeUrl', () {
    test('should return null for null input', () {
      expect(punycodeDecodeUrl(null), isNull);
    });

    test('should return null for an invalid URL', () {
      // "not a url" should fail to parse.
      expect(punycodeDecodeUrl('not a url'), isNull);
    });

    test('should return null for a URL with empty host', () {
      // "https://" is a valid scheme but with no host.
      expect(punycodeDecodeUrl('https://'), isNull);
    });

    test('should return ASCII-only URL unchanged', () {
      const url = 'https://example.com';
      expect(punycodeDecodeUrl(url), equals(url));
    });

    test('should decode a single-segment Punycode domain', () {
      const input = 'https://xn--bcher-kva.de';
      const expected = 'https://bücher.de';
      expect(punycodeDecodeUrl(input), equals(expected));
    });

    test('should decode a multi-segment Punycode domain', () {
      const input = 'https://shop.xn--bcher-kva.de';
      const expected = 'https://shop.bücher.de';
      expect(punycodeDecodeUrl(input), equals(expected));
    });

    test('should decode URL with port', () {
      const input = 'https://xn--bcher-kva.de:8080';
      const expected = 'https://bücher.de:8080';
      expect(punycodeDecodeUrl(input), equals(expected));
    });

    test('should decode domains with uppercase punycode prefix correctly', () {
      const input = 'https://XN--BCHER-KVA.de';
      const expected = 'https://bücher.de';
      expect(punycodeDecodeUrl(input), equals(expected));
    });

    test('should handle mixed segments with no punycode in some parts', () {
      const input = 'https://news.xn--bcher-kva.de';
      const expected = 'https://news.bücher.de';
      expect(punycodeDecodeUrl(input), equals(expected));
    });

    test('should decode the domain of the original issue poster :)', () {
      const url = 'https://xn--n1aalg.xn--90ailhbncb6fh7b.xn--p1ai/';
      const expected = 'https://фото.большойчлен.рф/';
      expect(punycodeDecodeUrl(url), expected);
    });
  });
}
