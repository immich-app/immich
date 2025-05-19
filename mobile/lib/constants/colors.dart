import 'package:flutter/material.dart';

enum ImmichColorPreset {
  indigo,
  deepPurple,
  pink,
  red,
  orange,
  yellow,
  lime,
  green,
  cyan,
  slateGray
}

const ImmichColorPreset defaultColorPreset = ImmichColorPreset.indigo;
const String defaultColorPresetName = "indigo";

const Color immichBrandColorLight = Color(0xFF4150AF);
const Color immichBrandColorDark = Color(0xFFACCBFA);
const Color whiteOpacity75 = Color.fromARGB((0.75 * 255) ~/ 1, 255, 255, 255);
const Color red400 = Color(0xFFEF5350);
const Color grey200 = Color(0xFFEEEEEE);
