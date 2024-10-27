import 'dart:math';

extension NumberToSizeExtension on num {
  String formatAsSize({int noOfDecimals = 0}) {
    const List<String> units = [
      'B',
      'KB',
      'MB',
      'GB',
      'TB',
      'PB',
      'EB',
      'ZB',
      'YB',
    ];
    if (this == 0) return '0 B';
    final index = (log(this) / log(1024)).floor();
    final byteIndex = index.clamp(0, units.length - 1);

    final size = (this / pow(1024, byteIndex)).round();
    // ignore: avoid-unsafe-collection-methods
    return '${size.toStringAsFixed(noOfDecimals)} ${units[byteIndex]}';
  }
}
