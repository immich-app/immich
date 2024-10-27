import 'package:flutter/material.dart';

@immutable
abstract final class AppColors {
  const AppColors();

  static final blueLight = ColorScheme.fromSeed(
    seedColor: Color(0xff1145a4),
    brightness: Brightness.light,
  );
  static final blueDark = ColorScheme.fromSeed(
    seedColor: Color(0xff001b3d),
    brightness: Brightness.dark,
  );
}
