
String formatBytes(int bytes) {
  if (bytes < 1000) {
    return "$bytes B";
  } else if (bytes < 1000000) {
    final kb = (bytes / 1000).toStringAsFixed(1);
    return "$kb kB";
  } else if (bytes < 1000000000) {
    final mb = (bytes / 1000000).toStringAsFixed(1);
    return "$mb MB";
  } else {
    final gb = (bytes / 1000000000).toStringAsFixed(1);
    return "$gb GB";
  }
}