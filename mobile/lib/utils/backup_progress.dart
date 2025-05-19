import 'dart:async';
import 'dart:developer';

import 'package:easy_localization/easy_localization.dart';

final NumberFormat numberFormat = NumberFormat("###0.##");

String formatAssetBackupProgress(int uploadedAssets, int assetsToUpload) {
  final int percent = (uploadedAssets * 100) ~/ assetsToUpload;
  return "$percent% ($uploadedAssets/$assetsToUpload)";
}

/// prints progress in useful (kilo/mega/giga)bytes
String humanReadableFileBytesProgress(int bytes, int bytesTotal) {
  String unit = "KB";

  if (bytesTotal >= 0x40000000) {
    unit = "GB";
    bytes >>= 20;
    bytesTotal >>= 20;
  } else if (bytesTotal >= 0x100000) {
    unit = "MB";
    bytes >>= 10;
    bytesTotal >>= 10;
  } else if (bytesTotal < 0x400) {
    return "${(bytes).toStringAsFixed(2)} B / ${(bytesTotal).toStringAsFixed(2)} B";
  }

  return "${(bytes / 1024.0).toStringAsFixed(2)} $unit / ${(bytesTotal / 1024.0).toStringAsFixed(2)} $unit";
}

/// prints percentage and absolute progress in useful (kilo/mega/giga)bytes
String humanReadableBytesProgress(int bytes, int bytesTotal) {
  String unit = "KB"; // Kilobyte
  if (bytesTotal >= 0x40000000) {
    unit = "GB"; // Gigabyte
    bytes >>= 20;
    bytesTotal >>= 20;
  } else if (bytesTotal >= 0x100000) {
    unit = "MB"; // Megabyte
    bytes >>= 10;
    bytesTotal >>= 10;
  } else if (bytesTotal < 0x400) {
    return "$bytes / $bytesTotal B";
  }
  final int percent = (bytes * 100) ~/ bytesTotal;
  final String done = numberFormat.format(bytes / 1024.0);
  final String total = numberFormat.format(bytesTotal / 1024.0);
  return "$percent% ($done/$total$unit)";
}

class ThrottleProgressUpdate {
  ThrottleProgressUpdate(this._fun, Duration interval)
      : _interval = interval.inMicroseconds;
  final void Function(String?, int, int) _fun;
  final int _interval;
  int _invokedAt = 0;
  Timer? _timer;

  String? title;
  int progress = 0;
  int total = 0;

  void call({
    final String? title,
    final int progress = 0,
    final int total = 0,
  }) {
    final time = Timeline.now;
    this.title = title ?? this.title;
    this.progress = progress;
    this.total = total;
    if (time > _invokedAt + _interval) {
      _timer?.cancel();
      _onTimeElapsed();
    } else {
      _timer ??= Timer(Duration(microseconds: _interval), _onTimeElapsed);
    }
  }

  void _onTimeElapsed() {
    _invokedAt = Timeline.now;
    _fun(title, progress, total);
    _timer = null;
    // clear title to not send/overwrite it next time if unchanged
    title = null;
  }
}
