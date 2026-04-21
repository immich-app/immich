import 'dart:convert';

extension StringExtension on String {
  String capitalize() {
    return split(" ").map((str) => str.isEmpty ? str : str[0].toUpperCase() + str.substring(1)).join(" ");
  }
}

extension DurationExtension on String {
  /// Parses and returns the string of format HH:MM:SS.ffffff as a duration object else null
  Duration? toDuration() {
    try {
      final parts = split(':');
      final hours = double.parse(parts[0]).toInt();
      final minutes = double.parse(parts[1]).toInt();
      final secondsParts = parts[2].split('.');
      final seconds = int.parse(secondsParts[0]);
      final milliseconds = secondsParts.length > 1 ? (double.parse('0.${secondsParts[1]}') * 1000).round() : 0;
      return Duration(hours: hours, minutes: minutes, seconds: seconds, milliseconds: milliseconds);
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

Map<String, dynamic>? tryJsonDecode(dynamic json) {
  try {
    return jsonDecode(json) as Map<String, dynamic>;
  } catch (e) {
    return null;
  }
}
