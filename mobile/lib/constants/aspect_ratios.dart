import 'package:flutter/material.dart';

enum CropAspectRatio {
  free(customLabel: 'Free', icon: Icons.crop_free),
  original(customLabel: 'Original', icon: Icons.crop_original),
  ratio1x1(numerator: 1, denominator: 1),
  ratio16x9(numerator: 16, denominator: 9),
  ratio3x2(numerator: 3, denominator: 2),
  ratio7x5(numerator: 7, denominator: 5),
  ratio4x3(numerator: 4, denominator: 3),
  ratio9x16(numerator: 9, denominator: 16),
  ratio2x3(numerator: 2, denominator: 3),
  ratio5x7(numerator: 5, denominator: 7),
  ratio3x4(numerator: 3, denominator: 4);

  final int? numerator;
  final int? denominator;
  final String? customLabel;
  final IconData? icon;

  const CropAspectRatio({this.numerator, this.denominator, this.customLabel, this.icon});

  String get label => customLabel ?? '$numerator:$denominator';
  double? get ratio => (numerator != null && denominator != null) ? numerator! / denominator! : null;
  CropAspectRatio get flipped {
    if (numerator == denominator) {
      return this;
    }
    for (final value in CropAspectRatio.values) {
      if (value.numerator == denominator && value.denominator == numerator) {
        return value;
      }
    }
    return this;
  }
}
