import 'dart:math' as math;

String formatBytes(int bytes) {
  if (bytes >= math.pow(1024, 5)) {
    return "${(bytes / math.pow(1024, 5)).toStringAsFixed(1)} PiB";
  } else if (bytes >= math.pow(1024, 4)) {
    return "${(bytes / math.pow(1024, 4)).toStringAsFixed(1)} TiB";
  } else if (bytes >= math.pow(1024, 3)) {
    return "${(bytes / math.pow(1024, 3)).toStringAsFixed(1)} GiB";
  } else if (bytes >= math.pow(1024, 2)) {
    return "${(bytes / math.pow(1024, 2)).toStringAsFixed(1)} MiB";
  } else if (bytes >= 1024) {
    return "${(bytes / 1024).toStringAsFixed(1)} KiB";
  } else {
    return "$bytes B";
  }
}
