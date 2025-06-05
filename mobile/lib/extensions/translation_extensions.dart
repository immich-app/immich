import 'package:flutter/material.dart';
import 'package:immich_mobile/services/localization.service.dart';

final _translationService = EasyLocalizationService();

extension StringTranslation on String {
  String t([Map<String, Object>? args]) {
    return _translationService.translate(this, args);
  }
}

extension BuildContextTranslation on BuildContext {
  String t(String key, [Map<String, Object>? args]) {
    return _translationService.translate(key, args);
  }
}
