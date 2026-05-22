import 'package:flutter/material.dart';
import 'package:immich_mobile/hearth_config.dart';

enum ImmichColorPreset { indigo, deepPurple, pink, red, orange, yellow, lime, green, cyan, slateGray }

const ImmichColorPreset defaultColorPreset = ImmichColorPreset.indigo;
const String defaultColorPresetName = "indigo";

const Color immichBrandColorLight = HearthConfig.primaryColor;
const Color immichBrandColorDark = HearthConfig.secondaryColor;
const Color whiteOpacity75 = Color.fromRGBO(255, 255, 255, 0.75);
const Color red400 = Color(0xFFEF5350);
const Color grey200 = Color(0xFFEEEEEE);
