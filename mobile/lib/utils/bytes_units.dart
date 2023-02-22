String formatBytes(int bytes) {
  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB'];

  int magnitude = 0;
  double remainder = bytes.toDouble();
  while (remainder >= 1024) {
    if (magnitude + 1 < units.length) {
      magnitude++;
      remainder /= 1024;
    }
    else {
      break;
    }
  }

  return "${remainder.toStringAsFixed(magnitude == 0 ? 0 : 1)} ${units[magnitude]}";
}
