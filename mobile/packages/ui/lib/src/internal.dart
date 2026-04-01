import 'package:flutter/material.dart';
import 'package:immich_ui/src/translation.dart';

extension TranslationHelper on BuildContext {
  ImmichTranslations get translations => ImmichTranslationProvider.of(this);
}
