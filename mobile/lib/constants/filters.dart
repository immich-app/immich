import 'package:flutter/material.dart';

List<ColorFilter> filters = [
  ColorFilter.mode(Colors.red.withOpacity(0.0), BlendMode.color),
  const ColorFilter.matrix([
    1.2, 0.0, 0.0, 0.0, -10.0, // Red
    0.0, 1.2, 0.0, 0.0, -10.0, // Green
    0.0, 0.0, 1.1, 0.0, -10.0, // Blue
    0.0, 0.0, 0.0, 1.0, 0.0, // Alpha
  ]),
  const ColorFilter.matrix([
    1.3, 0.0, 0.0, 0.0, -50.0, // Red
    0.0, 1.3, 0.0, 0.0, -30.0, // Green
    0.0, 0.0, 1.3, 0.0, -20.0, // Blue
    0.0, 0.0, 0.0, 1.0, 0.0, // Alpha
  ]),
  const ColorFilter.matrix([
    1.0, 0.1, 0.1, 0.0, 0.0, // Red
    0.0, 1.1, 0.1, 0.0, 0.0, // Green
    0.0, 0.0, 1.1, 0.0, 0.0, // Blue
    0.0, 0.0, 0.0, 1.0, 0.0, // Alpha  // Alpha
  ]),
  const ColorFilter.matrix([
    0.3, 0.59, 0.11, 0.0, 0.0, // Red
    0.3, 0.59, 0.11, 0.0, 0.0, // Green
    0.3, 0.59, 0.11, 0.0, 0.0, // Blue
    0.0, 0.0, 0.0, 1.0, 0.0, // Alpha // Alpha
  ]),
  const ColorFilter.matrix([
    1.2, 0.0, 0.0, 0.0, 0.0, // Red
    0.0, 1.2, 0.0, 0.0, 0.0, // Green
    0.0, 0.0, 1.1, 0.0, 0.0, // Blue
    0.0, 0.0, 0.0, 1.0, 0.0, // Alpha
  ]),
  ColorFilter.mode(Colors.yellow.withOpacity(0.5), BlendMode.color),
  ColorFilter.mode(Colors.blue.withOpacity(0.5), BlendMode.color),
  ColorFilter.mode(Colors.yellow.withOpacity(0.5), BlendMode.color),
];

const List<String> filterNames = [
  'Original',
  'Amaro',
  'Clarendon',
  'Gingham',
  'Moon',
  "Lark",
  "Reyes",
  "Juno",
  "Slumber",
  "Crema",
  "Ludwig",
  "Aden",
  "Perpetua",
  "Mayfair",
  "Rise",
  "Hudson",
  "Valencia",
  "X-Pro II",
  "Sierra",
  "Willow",
  "Lo-Fi",
  "Inkwell",
  "Hefe",
  "Nashville",
  "Stinson",
  "Vesper",
  "Earlybird",
  "Brannan",
  "Sutro",
  "Toaster",
  "Walden",
  "1977",
  "Kelvin",
  "Maven",
  "Ginza",
  "Nishita",
  "Dogpatch",
  "Helena",
  "Ashby",
  "Yuvi",
  "Charmes",
  "Brooklyn",
  "Skyline"
];
