import 'dart:async';

import 'package:flutter/material.dart';

class Debounce {
  Debounce(Duration interval) : _interval = interval.inMilliseconds;
  final int _interval;
  Timer? _timer;
  VoidCallback? action;

  void call(VoidCallback? action) {
    this.action = action;
    _timer?.cancel();
    _timer = Timer(Duration(milliseconds: _interval), _callAndRest);
  }

  void _callAndRest() {
    action?.call();
    _timer = null;
  }

  void dispose() {
    _timer?.cancel();
    _timer = null;
  }
}
