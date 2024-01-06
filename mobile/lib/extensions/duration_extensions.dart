extension TZOffsetExtension on Duration {
  /// Formats the duration in the format of ±HH:MM
  String formatAsOffset() =>
      "${isNegative ? '-' : '+'}${inHours.abs().toString().padLeft(2, '0')}:${inMinutes.abs().remainder(60).toString().padLeft(2, '0')}";
}
