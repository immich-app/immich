import 'dart:io';

import 'package:flutter/foundation.dart';

extension CurrentPlatform on TargetPlatform {
  @pragma('vm:prefer-inline')
  static bool get isIOS => defaultTargetPlatform == TargetPlatform.iOS;

  @pragma('vm:prefer-inline')
  static bool get isAndroid => defaultTargetPlatform == TargetPlatform.android;

  static bool? _isIOS17OrAbove;
  static bool get isIOS17OrAbove {
    if (_isIOS17OrAbove != null) return _isIOS17OrAbove!;
    if (!isIOS) {
      _isIOS17OrAbove = false;
      return false;
    }
    final version = Platform.operatingSystemVersion;
    final match = RegExp(r'(\d+)').firstMatch(version);
    _isIOS17OrAbove = match != null && int.parse(match.group(1)!) >= 17;
    return _isIOS17OrAbove!;
  }
}
