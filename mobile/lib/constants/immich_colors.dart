import 'package:flutter/material.dart';

const Color _indigoLightColor = Color(0xFF4251B0);
const Color _indigoDarkColor = Color(0xFFACCBFA);
const Color _blueLightColor = Color(0xFF006497);
const Color _blueDarkColor = Color(0xFFA6CAEC);
const Color _tealLightColor = Color(0xFF006a68);
const Color _tealDarkColor = Color(0xFF72D7D3);
const Color _greenLightColor = Color(0xFF346A22);
const Color _greenDarkColor = Color(0xFF99D680);
const Color _limeLightColor = Color(0xFF779516);
const Color _limeDarkColor = Color(0xffA4C63B);
const Color _yellowLightColor = Color(0xFF916314);
const Color _yellowDarkColor = Color(0xFFECC248);
const Color _orangeLightColor = Color(0xFFF3511E);
const Color _orangeDarkColor = Color(0xFFF48D6D);
const Color _redLightColor = Color(0xFFB3271E);
const Color _redDarkColor = Color(0xFFFFB4A3);
const Color _purpleLightColor = Color(0xFF9A25AE);
const Color _purpleDarkColor = Color(0xFFF9ABFF);
const Color _deepPurpleLightColor = Color(0xFF6F43C0);
const Color _deepPurpleDarkColor = Color(0xFFD3BBFF);
const Color _blueGreyLightColor = Color(0xFF506261);
const Color _blueGreyDarkColor = Color(0xFFB8CAC9);
const Color _brownLightColor = Color(0xFF563826);
const Color _brownDarkColor = Color(0xFFEBB799);

final Map<String, Map<String, Color>> colorMap = {
  ImmichColorMode.indigo.name: {
    'light': _indigoLightColor,
    'dark': _indigoDarkColor,
  },
  ImmichColorMode.blue.name: {
    'light': _blueLightColor,
    'dark': _blueDarkColor,
  },
  ImmichColorMode.teal.name: {
    'light': _tealLightColor,
    'dark': _tealDarkColor,
  },
  ImmichColorMode.green.name: {
    'light': _greenLightColor,
    'dark': _greenDarkColor,
  },
  ImmichColorMode.lime.name: {
    'light': _limeLightColor,
    'dark': _limeDarkColor,
  },
  ImmichColorMode.yellow.name: {
    'light': _yellowLightColor,
    'dark': _yellowDarkColor,
  },
  ImmichColorMode.orange.name: {
    'light': _orangeLightColor,
    'dark': _orangeDarkColor,
  },
  ImmichColorMode.red.name: {
    'light': _redLightColor,
    'dark': _redDarkColor,
  },
  ImmichColorMode.purple.name: {
    'light': _purpleLightColor,
    'dark': _purpleDarkColor,
  },
  ImmichColorMode.deepPurple.name: {
    'light': _deepPurpleLightColor,
    'dark': _deepPurpleDarkColor,
  },
  ImmichColorMode.blueGrey.name: {
    'light': _blueGreyLightColor,
    'dark': _blueGreyDarkColor,
  },
  ImmichColorMode.brown.name: {
    'light': _brownLightColor,
    'dark': _brownDarkColor,
  },
};

const String defaultPrimaryColorType = "indigo";

enum ImmichColorMode {
  indigo,
  blue,
  teal,
  green,
  lime,
  yellow,
  orange,
  red,
  purple,
  deepPurple,
  blueGrey,
  brown
}

extension ImmichColorModeExtension on ImmichColorMode {
  Color getColor(bool isDark) =>
      colorMap[name]?[isDark ? 'dark' : 'light'] as Color;
}
