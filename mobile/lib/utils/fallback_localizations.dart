import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

// Flutter ships no Material or Cupertino strings for some of our languages, use English for those
const List<LocalizationsDelegate> fallbackLocalizationDelegates = [
  _FallbackLocalizationsDelegate<MaterialLocalizations>(DefaultMaterialLocalizations.delegate),
  _FallbackLocalizationsDelegate<CupertinoLocalizations>(DefaultCupertinoLocalizations.delegate),
];

class _FallbackLocalizationsDelegate<T> extends LocalizationsDelegate<T> {
  final LocalizationsDelegate<T> delegate;

  const _FallbackLocalizationsDelegate(this.delegate);

  @override
  bool isSupported(Locale locale) => true;

  @override
  Future<T> load(Locale locale) => delegate.load(const Locale('en'));

  @override
  bool shouldReload(_FallbackLocalizationsDelegate<T> old) => false;
}
