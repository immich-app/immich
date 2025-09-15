import 'package:flutter/foundation.dart';

extension CurrentPlatform on TargetPlatform {
  @pragma('vm:prefer-inline')
  static bool get isIOS => defaultTargetPlatform == TargetPlatform.iOS;

  @pragma('vm:prefer-inline')
  static bool get isAndroid => defaultTargetPlatform == TargetPlatform.android;
}
