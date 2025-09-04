import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:immich_mobile/generated/locale_names.g.dart';

final Map<String, Locale> locales = {for (final entry in localeNames.entries) entry.value: _parseLocale(entry.key)};

Locale _parseLocale(String code) {
  final parts = code.split('_');
  if (parts.length == 1) {
    return Locale(parts[0]);
  } else if (parts.length == 2) {
    if (parts[1].length == 2) {
      return Locale(parts[0], parts[1]);
    } else {
      return Locale.fromSubtags(languageCode: parts[0], scriptCode: parts[1]);
    }
  } else if (parts.length == 3) {
    return Locale.fromSubtags(languageCode: parts[0], scriptCode: parts[1], countryCode: parts[2]);
  }
  throw ArgumentError('Invalid locale code: $code');
}

const String translationsPath = 'assets/i18n';

const List<Locale> localesNotSupportedByAppFont = [Locale('el', 'GR'), Locale('sr', 'Cyrl')];
