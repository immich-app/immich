import 'package:flutter/material.dart';
import 'package:immich_ui/src/color_override.dart';
import 'package:immich_ui/src/translation.dart';

extension TranslationHelper on BuildContext {
  ImmichTranslations get translations => ImmichTranslationProvider.of(this);
}

extension ColorHelper on BuildContext {
  Color? get colorOverride => ImmichColorOverride.maybeOf(this);
}
