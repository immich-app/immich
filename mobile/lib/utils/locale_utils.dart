import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

bool isMaterialSupported(Locale locale) {
  final delegates = [
    GlobalMaterialLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
  ];
  return delegates.every((d) => d.isSupported(locale));
}
