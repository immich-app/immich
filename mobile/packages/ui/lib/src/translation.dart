import 'package:flutter/material.dart';

class ImmichTranslations {
  final String submit;
  final String password;
  final String undo;

  const ImmichTranslations({String? submit, String? password, String? undo})
    : submit = submit ?? 'Submit',
      password = password ?? 'Password',
      undo = undo ?? 'Undo';
}

class ImmichTranslationProvider extends InheritedWidget {
  final ImmichTranslations? translations;

  const ImmichTranslationProvider({super.key, this.translations, required super.child});

  static ImmichTranslations of(BuildContext context) {
    final provider = context.dependOnInheritedWidgetOfExactType<ImmichTranslationProvider>();
    return provider?.translations ?? const ImmichTranslations();
  }

  @override
  bool updateShouldNotify(covariant ImmichTranslationProvider oldWidget) {
    return oldWidget.translations != translations;
  }
}
