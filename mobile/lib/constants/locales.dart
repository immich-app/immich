import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:immich_mobile/generated/codegen_loader.g.dart';

final Map<String, String> unsupportedLocales = {
  'bi': 'Bislama',
  'cv': 'Chuvash',
  'fil': 'Filipino',
  'kmr': 'Kurmanji (Northern Kurdish)',
  'mfa': 'Malay (Pattani)',
};

final Map<String, Locale> locales = {
  for (final entry in {
    for (final code in CodegenLoader.mapLocales.keys) code: _parseLocale(code),
  }.entries.toList()..sort((a, b) => a.key.compareTo(b.key))) // sort by code
    entry.key: entry.value,
};

Locale _parseLocale(String code) {
  final parts = code.split('_');
  if (parts.length == 1) {
    return Locale(parts[0]); // e.g. "en"
  } else if (parts.length == 2) {
    if (parts[1].length == 2) {
      // language + region, e.g. pt_BR
      return Locale(parts[0], parts[1]);
    } else {
      // language + script, e.g. sr_Latn or zh_Hans
      return Locale.fromSubtags(languageCode: parts[0], scriptCode: parts[1]);
    }
  } else if (parts.length == 3) {
    // language + script + region (rare but valid BCP-47)
    return Locale.fromSubtags(languageCode: parts[0], scriptCode: parts[1], countryCode: parts[2]);
  }
  throw ArgumentError('Invalid locale code: $code');
}

const String translationsPath = 'assets/i18n';

const List<Locale> localesNotSupportedByAppFont = [Locale('el', 'GR'), Locale('sr', 'Cyrl')];
