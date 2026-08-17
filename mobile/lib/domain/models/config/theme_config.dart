import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:immich_mobile/constants/colors.dart';

part 'theme_config.freezed.dart';

@freezed
abstract class ThemeConfig with _$ThemeConfig {
  const factory ThemeConfig({
    @Default(ThemeMode.system) ThemeMode mode,
    @Default(ImmichColorPreset.indigo) ImmichColorPreset primaryColor,
    @Default(false) bool dynamicTheme,
    @Default(true) bool colorfulInterface,
  }) = _ThemeConfig;
}
