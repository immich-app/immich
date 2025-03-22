import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

class LifecycleEventHandler extends WidgetsBindingObserver {
  final AsyncCallback? onResume;
  final AsyncCallback? onPause;

  LifecycleEventHandler({this.onResume, this.onPause});

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    switch (state) {
      case AppLifecycleState.resumed:
        if (onResume != null) {
          onResume!();
        }
        break;
      case AppLifecycleState.paused:
        if (onPause != null) {
          onPause!();
        }
        break;
      default:
        break;
    }
  }
}
