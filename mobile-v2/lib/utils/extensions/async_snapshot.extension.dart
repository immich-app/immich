import 'package:flutter/material.dart';

extension AsynSnapShotState on AsyncSnapshot {
  bool get isWaiting => connectionState == ConnectionState.waiting;
  bool get isDone => connectionState == ConnectionState.done;
}
