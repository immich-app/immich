import 'dart:typed_data';

import 'package:uuid/parsing.dart';

extension StringExtension on String {
  String capitalize() {
    return split(" ")
        .map(
          (str) => str.isEmpty ? str : str[0].toUpperCase() + str.substring(1),
        )
        .join(" ");
  }
}

extension DurationExtension on String {
  /// Parses and returns the string of format HH:MM:SS as a duration object else null
  Duration? toDuration() {
    try {
      final parts = split(':')
          .map((e) => double.parse(e).toInt())
          .toList(growable: false);
      return Duration(hours: parts[0], minutes: parts[1], seconds: parts[2]);
    } catch (e) {
      return null;
    }
  }

  double toDouble() {
    return double.parse(this);
  }

  int toInt() {
    return int.parse(this);
  }
}

extension UUIDExtension on String {
  Uint8List toUuidByte({bool shouldValidate = false}) =>
      UuidParsing.parseAsByteList(this, validate: shouldValidate);
}
