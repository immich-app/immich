extension TZOffsetExtension on Duration {
  String formatAsOffset() =>
      "${isNegative ? '-' : '+'}${inHours.abs().toString().padLeft(2, '0')}:${inMinutes.abs().remainder(60).toString().padLeft(2, '0')}";
}
