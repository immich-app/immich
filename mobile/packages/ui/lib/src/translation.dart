import 'package:flutter/material.dart';

class ImmichTranslations {
  late String submit;
  late String password;

  ImmichTranslations({String? submit, String? password}) {
    this.submit = submit ?? 'Submit';
    this.password = password ?? 'Password';
  }
}

class ImmichTranslationProvider extends InheritedWidget {
  final ImmichTranslations? translations;

  const ImmichTranslationProvider({
    super.key,
    this.translations,
    required super.child,
  });

  static ImmichTranslations of(BuildContext context) {
    final provider = context.dependOnInheritedWidgetOfExactType<ImmichTranslationProvider>();
    return provider?.translations ?? ImmichTranslations();
  }

  @override
  bool updateShouldNotify(covariant ImmichTranslationProvider oldWidget) {
    return oldWidget.translations != translations;
  }
}
