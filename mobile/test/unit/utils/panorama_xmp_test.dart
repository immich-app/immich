import 'dart:convert';
import 'dart:typed_data';
import 'dart:ui';

import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/utils/panorama_xmp.dart';

// Builds a minimal JPEG with a standard XMP APP1 segment.
Uint8List _jpegWithXmp(String xmpPayload) {
  const ns = 'http://ns.adobe.com/xap/1.0/\x00';
  final nsBytes = utf8.encode(ns);
  final xmpBytes = utf8.encode(xmpPayload);
  final segData = [...nsBytes, ...xmpBytes];
  final segLen = segData.length + 2;
  return Uint8List.fromList([
    0xFF, 0xD8, // SOI
    0xFF, 0xE1, // APP1
    (segLen >> 8) & 0xFF, segLen & 0xFF,
    ...segData,
    0xFF, 0xDA, // SOS — stops metadata parsing
  ]);
}

// Builds a JPEG with an Extended XMP APP1 segment (no standard XMP).
Uint8List _jpegWithExtXmp(String xmpPayload, {int chunkOffset = 0}) {
  const ns = 'http://ns.adobe.com/xmp/extension/\x00';
  final nsBytes = utf8.encode(ns);
  final guid = List<int>.filled(32, 0x41); // 32-byte GUID placeholder
  final xmpBytes = utf8.encode(xmpPayload);
  final totalLen = xmpBytes.length;
  final header = [
    (totalLen >> 24) & 0xFF,
    (totalLen >> 16) & 0xFF,
    (totalLen >> 8) & 0xFF,
    totalLen & 0xFF,
    (chunkOffset >> 24) & 0xFF,
    (chunkOffset >> 16) & 0xFF,
    (chunkOffset >> 8) & 0xFF,
    chunkOffset & 0xFF,
  ];
  final segData = [...nsBytes, ...guid, ...header, ...xmpBytes];
  final segLen = segData.length + 2;
  return Uint8List.fromList([
    0xFF, 0xD8,
    0xFF, 0xE1,
    (segLen >> 8) & 0xFF, segLen & 0xFF,
    ...segData,
    0xFF, 0xDA,
  ]);
}

const _attrXmp = 'GPano:FullPanoWidthPixels="8000" '
    'GPano:FullPanoHeightPixels="4000" '
    'GPano:CroppedAreaImageWidthPixels="6000" '
    'GPano:CroppedAreaImageHeightPixels="3000" '
    'GPano:CroppedAreaLeftPixels="1000" '
    'GPano:CroppedAreaTopPixels="500"';

void main() {
  group('readPanoramaXmpFromBytes', () {
    test('returns null for empty input', () {
      expect(readPanoramaXmpFromBytes(Uint8List(0)), isNull);
    });

    test('returns null for non-JPEG bytes', () {
      // PNG magic bytes
      final png = Uint8List.fromList([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A]);
      expect(readPanoramaXmpFromBytes(png), isNull);
    });

    test('returns null for JPEG without XMP', () {
      final bytes = Uint8List.fromList([0xFF, 0xD8, 0xFF, 0xDA]);
      expect(readPanoramaXmpFromBytes(bytes), isNull);
    });

    test('returns null for JPEG with XMP but no GPano data', () {
      final bytes = _jpegWithXmp('<x:xmpmeta><rdf:RDF/></x:xmpmeta>');
      expect(readPanoramaXmpFromBytes(bytes), isNull);
    });

    group('attribute-style GPano', () {
      test('parses crop area from pixel values', () {
        final bytes = _jpegWithXmp('<rdf:Description $_attrXmp/>');
        final result = readPanoramaXmpFromBytes(bytes);

        expect(result, isNotNull);
        expect(result!.croppedArea.left, closeTo(1000 / 8000, 1e-9));
        expect(result.croppedArea.top, closeTo(500 / 4000, 1e-9));
        expect(result.croppedArea.width, closeTo(6000 / 8000, 1e-9));
        expect(result.croppedArea.height, closeTo(3000 / 4000, 1e-9));
      });

      test('defaults CroppedAreaLeft and CroppedAreaTop to 0 when absent', () {
        const xmp = 'GPano:FullPanoWidthPixels="4000" '
            'GPano:FullPanoHeightPixels="2000" '
            'GPano:CroppedAreaImageWidthPixels="4000" '
            'GPano:CroppedAreaImageHeightPixels="2000"';
        final bytes = _jpegWithXmp('<rdf:Description $xmp/>');
        final result = readPanoramaXmpFromBytes(bytes);

        expect(result, isNotNull);
        expect(result!.croppedArea, const Rect.fromLTWH(0, 0, 1, 1));
      });

      test('reads InitialViewHeadingDegrees', () {
        final bytes = _jpegWithXmp(
          '<rdf:Description $_attrXmp GPano:InitialViewHeadingDegrees="90"/>',
        );
        expect(readPanoramaXmpFromBytes(bytes)?.initialHeadingDegrees, 90.0);
      });

      test('reads negative InitialViewPitchDegrees', () {
        final bytes = _jpegWithXmp(
          '<rdf:Description $_attrXmp GPano:InitialViewPitchDegrees="-10"/>',
        );
        expect(readPanoramaXmpFromBytes(bytes)?.initialPitchDegrees, -10.0);
      });

      test('returns null when FullPanoWidthPixels is missing', () {
        const xmp = 'GPano:FullPanoHeightPixels="4000" '
            'GPano:CroppedAreaImageWidthPixels="4000" '
            'GPano:CroppedAreaImageHeightPixels="4000"';
        final bytes = _jpegWithXmp('<rdf:Description $xmp/>');
        expect(readPanoramaXmpFromBytes(bytes), isNull);
      });

      test('returns null when CroppedAreaImageHeightPixels is missing', () {
        const xmp = 'GPano:FullPanoWidthPixels="4000" '
            'GPano:FullPanoHeightPixels="2000" '
            'GPano:CroppedAreaImageWidthPixels="4000"';
        final bytes = _jpegWithXmp('<rdf:Description $xmp/>');
        expect(readPanoramaXmpFromBytes(bytes), isNull);
      });

      test('returns null when FullPanoWidthPixels is zero', () {
        const xmp = 'GPano:FullPanoWidthPixels="0" '
            'GPano:FullPanoHeightPixels="4000" '
            'GPano:CroppedAreaImageWidthPixels="4000" '
            'GPano:CroppedAreaImageHeightPixels="2000"';
        final bytes = _jpegWithXmp('<rdf:Description $xmp/>');
        expect(readPanoramaXmpFromBytes(bytes), isNull);
      });
    });

    group('element-style GPano', () {
      test('parses full-sphere from XML elements', () {
        const xmp = '<GPano:FullPanoWidthPixels>8000</GPano:FullPanoWidthPixels>'
            '<GPano:FullPanoHeightPixels>4000</GPano:FullPanoHeightPixels>'
            '<GPano:CroppedAreaImageWidthPixels>8000</GPano:CroppedAreaImageWidthPixels>'
            '<GPano:CroppedAreaImageHeightPixels>4000</GPano:CroppedAreaImageHeightPixels>'
            '<GPano:CroppedAreaLeftPixels>0</GPano:CroppedAreaLeftPixels>'
            '<GPano:CroppedAreaTopPixels>0</GPano:CroppedAreaTopPixels>';
        final bytes = _jpegWithXmp(xmp);
        final result = readPanoramaXmpFromBytes(bytes);

        expect(result, isNotNull);
        expect(result!.croppedArea, const Rect.fromLTWH(0, 0, 1, 1));
      });

      test('reads InitialViewHeadingDegrees from elements', () {
        const xmp = '<GPano:FullPanoWidthPixels>4000</GPano:FullPanoWidthPixels>'
            '<GPano:FullPanoHeightPixels>2000</GPano:FullPanoHeightPixels>'
            '<GPano:CroppedAreaImageWidthPixels>4000</GPano:CroppedAreaImageWidthPixels>'
            '<GPano:CroppedAreaImageHeightPixels>2000</GPano:CroppedAreaImageHeightPixels>'
            '<GPano:InitialViewHeadingDegrees>180</GPano:InitialViewHeadingDegrees>';
        final bytes = _jpegWithXmp(xmp);
        expect(readPanoramaXmpFromBytes(bytes)?.initialHeadingDegrees, 180.0);
      });
    });

    group('Extended XMP', () {
      test('parses GPano from extended XMP when no standard XMP is present', () {
        const xmp = 'GPano:FullPanoWidthPixels="4000" '
            'GPano:FullPanoHeightPixels="2000" '
            'GPano:CroppedAreaImageWidthPixels="4000" '
            'GPano:CroppedAreaImageHeightPixels="2000"';
        final bytes = _jpegWithExtXmp(xmp);
        final result = readPanoramaXmpFromBytes(bytes);

        expect(result, isNotNull);
        expect(result!.croppedArea, const Rect.fromLTWH(0, 0, 1, 1));
      });

      test('standard XMP takes priority over extended XMP when both have GPano', () {
        // Standard XMP: 2000×1000 panorama
        const stdNs = 'http://ns.adobe.com/xap/1.0/\x00';
        final stdNsBytes = utf8.encode(stdNs);
        const stdXmp = 'GPano:FullPanoWidthPixels="2000" '
            'GPano:FullPanoHeightPixels="1000" '
            'GPano:CroppedAreaImageWidthPixels="2000" '
            'GPano:CroppedAreaImageHeightPixels="1000"';
        final stdSegData = [...stdNsBytes, ...utf8.encode(stdXmp)];
        final stdSegLen = stdSegData.length + 2;

        // Extended XMP: different 8000×4000 values
        const extNs = 'http://ns.adobe.com/xmp/extension/\x00';
        final extNsBytes = utf8.encode(extNs);
        final guid = List<int>.filled(32, 0x43);
        const extXmp = 'GPano:FullPanoWidthPixels="8000" '
            'GPano:FullPanoHeightPixels="4000" '
            'GPano:CroppedAreaImageWidthPixels="8000" '
            'GPano:CroppedAreaImageHeightPixels="4000"';
        final extXmpBytes = utf8.encode(extXmp);
        final totalLen = extXmpBytes.length;
        final extHeader = [
          (totalLen >> 24) & 0xFF,
          (totalLen >> 16) & 0xFF,
          (totalLen >> 8) & 0xFF,
          totalLen & 0xFF,
          0, 0, 0, 0,
        ];
        final extSegData = [...extNsBytes, ...guid, ...extHeader, ...extXmpBytes];
        final extSegLen = extSegData.length + 2;

        final bytes = Uint8List.fromList([
          0xFF, 0xD8,
          0xFF, 0xE1,
          (stdSegLen >> 8) & 0xFF, stdSegLen & 0xFF,
          ...stdSegData,
          0xFF, 0xE1,
          (extSegLen >> 8) & 0xFF, extSegLen & 0xFF,
          ...extSegData,
          0xFF, 0xDA,
        ]);

        final result = readPanoramaXmpFromBytes(bytes);
        expect(result, isNotNull);
        // Must use standard XMP values, not the extended XMP 8000×4000.
        expect(result!.croppedArea, const Rect.fromLTWH(0, 0, 1, 1));
        expect(result.croppedArea.width, closeTo(2000 / 2000, 1e-9));
      });

      test('falls back to extended XMP when standard XMP has no GPano', () {
        // Standard XMP segment without GPano
        const stdNs = 'http://ns.adobe.com/xap/1.0/\x00';
        final stdNsBytes = utf8.encode(stdNs);
        final stdXmpBytes = utf8.encode('<x:xmpmeta/>');
        final stdSegData = [...stdNsBytes, ...stdXmpBytes];
        final stdSegLen = stdSegData.length + 2;

        // Extended XMP segment with GPano
        const extNs = 'http://ns.adobe.com/xmp/extension/\x00';
        final extNsBytes = utf8.encode(extNs);
        final guid = List<int>.filled(32, 0x42);
        const extPayload = 'GPano:FullPanoWidthPixels="2000" '
            'GPano:FullPanoHeightPixels="1000" '
            'GPano:CroppedAreaImageWidthPixels="2000" '
            'GPano:CroppedAreaImageHeightPixels="1000"';
        final extXmpBytes = utf8.encode(extPayload);
        final totalLen = extXmpBytes.length;
        final extHeader = [
          (totalLen >> 24) & 0xFF,
          (totalLen >> 16) & 0xFF,
          (totalLen >> 8) & 0xFF,
          totalLen & 0xFF,
          0, 0, 0, 0,
        ];
        final extSegData = [...extNsBytes, ...guid, ...extHeader, ...extXmpBytes];
        final extSegLen = extSegData.length + 2;

        final bytes = Uint8List.fromList([
          0xFF, 0xD8,
          0xFF, 0xE1,
          (stdSegLen >> 8) & 0xFF, stdSegLen & 0xFF,
          ...stdSegData,
          0xFF, 0xE1,
          (extSegLen >> 8) & 0xFF, extSegLen & 0xFF,
          ...extSegData,
          0xFF, 0xDA,
        ]);

        final result = readPanoramaXmpFromBytes(bytes);
        expect(result, isNotNull);
        expect(result!.croppedArea, const Rect.fromLTWH(0, 0, 1, 1));
      });
    });
  });
}
