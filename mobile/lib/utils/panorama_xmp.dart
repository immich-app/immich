import 'dart:convert';
import 'dart:math' as math;
import 'dart:typed_data';
import 'dart:ui';

class PanoramaXmpCrop {
  final Rect croppedArea;
  final double? initialHeadingDegrees;
  final double? initialPitchDegrees;

  const PanoramaXmpCrop({
    required this.croppedArea,
    this.initialHeadingDegrees,
    this.initialPitchDegrees,
  });
}

// Falls back to Extended XMP chunks if GPano fields are absent from the standard packet.
PanoramaXmpCrop? readPanoramaXmpFromBytes(Uint8List bytes) {
  final int readSize = bytes.length;
  if (readSize < 4 || bytes[0] != 0xFF || bytes[1] != 0xD8) {
    return null;
  }

  int offset = 2;
  const String xmpNs = 'http://ns.adobe.com/xap/1.0/';
  const String extNs = 'http://ns.adobe.com/xmp/extension/';

  String? standardXmp;
  final Map<int, Uint8List> extChunks = {}; // byte-offset → chunk data

  while (offset + 4 <= readSize) {
    if (bytes[offset] != 0xFF) {
      break;
    }
    final int marker = bytes[offset + 1];
    if (marker == 0xDA || marker == 0xD9) {
      break; // SOS / EOI — end of metadata
    }

    final int segLen = (bytes[offset + 2] << 8) | bytes[offset + 3];
    if (segLen < 2) {
      break;
    }

    final int nextOffset = offset + 2 + segLen;

    if (marker == 0xE1 && nextOffset <= readSize) {
      final int dataStart = offset + 4;

      if (standardXmp == null) {
        final int nsEnd = math.min(dataStart + xmpNs.length + 1, readSize);
        final String h = String.fromCharCodes(bytes.sublist(dataStart, nsEnd));
        if (h.startsWith(xmpNs)) {
          final int xmpStart = dataStart + xmpNs.length + 1;
          standardXmp = utf8.decode(
            bytes.sublist(xmpStart, math.min(nextOffset, readSize)),
            allowMalformed: true,
          );
        }
      }

      {
        final int nsEnd = math.min(dataStart + extNs.length + 1, readSize);
        final String h = String.fromCharCodes(bytes.sublist(dataStart, nsEnd));
        if (h.startsWith(extNs)) {
          final int guidBase = dataStart + extNs.length + 1;
          if (guidBase + 40 <= readSize) {
            final int chunkOff = _uint32BE(bytes, guidBase + 36);
            final int dataOff = guidBase + 40;
            final int dataEnd = math.min(nextOffset, readSize);
            if (dataOff < dataEnd) {
              extChunks[chunkOff] = bytes.sublist(dataOff, dataEnd);
            }
          }
        }
      }
    }

    if (nextOffset > readSize) {
      break;
    }
    offset = nextOffset;
  }

  if (standardXmp != null) {
    final result = _parsePanoramaXmp(standardXmp);
    if (result != null) {
      return result;
    }
  }

  if (extChunks.isNotEmpty) {
    final keys = extChunks.keys.toList()..sort();
    final buf = StringBuffer();
    for (final k in keys) {
      buf.write(utf8.decode(extChunks[k]!, allowMalformed: true));
    }
    return _parsePanoramaXmp(buf.toString());
  }

  return null;
}

int _uint32BE(Uint8List b, int i) =>
    (b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3];

PanoramaXmpCrop? _parsePanoramaXmp(String xmp) {
  if (!xmp.contains('GPano:')) {
    return null;
  }

  double? attr(String name) {
    final mA = RegExp('GPano:$name=["\'](-?[0-9]+(?:\\.[0-9]+)?)["\']').firstMatch(xmp);
    if (mA != null) {
      return double.tryParse(mA.group(1)!);
    }
    final mE = RegExp('<GPano:$name>(-?[0-9]+(?:\\.[0-9]+)?)</GPano:$name>').firstMatch(xmp);
    return mE != null ? double.tryParse(mE.group(1)!) : null;
  }

  final fullW = attr('FullPanoWidthPixels');
  final fullH = attr('FullPanoHeightPixels');
  final cropW = attr('CroppedAreaImageWidthPixels');
  final cropH = attr('CroppedAreaImageHeightPixels');
  final cropL = attr('CroppedAreaLeftPixels') ?? 0.0;
  final cropT = attr('CroppedAreaTopPixels') ?? 0.0;

  if (fullW == null || fullH == null || cropW == null || cropH == null) {
    return null;
  }
  if (fullW == 0 || fullH == 0 || cropW == 0 || cropH == 0) {
    return null;
  }

  return PanoramaXmpCrop(
    croppedArea: Rect.fromLTWH(
      cropL / fullW,
      cropT / fullH,
      cropW / fullW,
      cropH / fullH,
    ),
    initialHeadingDegrees: attr('InitialViewHeadingDegrees'),
    initialPitchDegrees: attr('InitialViewPitchDegrees'),
  );
}
