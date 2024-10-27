import 'package:flutter/material.dart';

@immutable
abstract final class SizeConstants {
  const SizeConstants._();

  static const s = 8.0;
  static const xs = 11.0;
  static const xxs = 14.0;
  static const m = 16.0;
  static const xm = 20.0;
  static const xxm = 25.0;
  static const l = 32.0;
  static const xl = 48.0;
  static const xxl = 64.0;
}

abstract final class RatioConstants {
  const RatioConstants._();

  // 0.75
  static const threeFourth = 3 / 4;
  // 0.6
  static const twoThird = 2 / 3;
  // 0.5
  static const half = 1 / 2;
  // 0.3
  static const oneThird = 1 / 3;
  // 0.25
  static const quarter = 1 / 4;
  // 0.15
  static const halfQuarter = 3 / 20;
  // 0.10
  static const oneTenth = 1 / 10;
}
