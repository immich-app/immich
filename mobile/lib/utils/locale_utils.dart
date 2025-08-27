import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:easy_localization/easy_localization.dart';

bool isMaterialSupported(Locale locale) {
  final delegates = [
    GlobalMaterialLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
  ];
  return delegates.every((d) => d.isSupported(locale));
}

Locale effectiveMaterialLocale(BuildContext context) {
  final current = context.locale;
  if (isMaterialSupported(current)) return current;

  final phoneLocale = WidgetsBinding.instance.platformDispatcher.locale;
  return isMaterialSupported(phoneLocale) ? phoneLocale : const Locale('en');
}
