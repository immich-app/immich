import 'package:flutter/material.dart';

@immutable
abstract final class SizeConstants {
  const SizeConstants._();

  static const s = 8.0;
  static const m = 16.0;
  static const xm = 25.0;
  static const l = 32.0;
  static const xl = 64.0;
}

abstract final class RatioConstants {
  const RatioConstants._();

  // 0.5
  static const oneHalf = 1 / 2;
  // 0.3
  static const oneThird = 1 / 3;
  // 0.25
  static const quarter = 1 / 4;
  // 0.15
  static const halfQuarter = 3 / 20;
}
