import 'package:flutter/foundation.dart';

@pragma('vm:prefer-inline')
void dPrint(String Function() message) {
  if (kDebugMode) {
    debugPrint(message());
  }
}
