// ignore_for_file: annotate_overrides

import 'package:flutter/material.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:immich_mobile/constants/colors.dart';

part 'theme_config.freezed.dart';

@freezed
class const ThemeConfig({
  final ThemeMode mode = .system,
  final ImmichColorPreset primaryColor = .indigo,
  final bool dynamicTheme = false,
  final bool colorfulInterface = true,
}) with _$ThemeConfig;
