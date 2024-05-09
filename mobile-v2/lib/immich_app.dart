import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:immich_mobile/i18n/strings.g.dart';
import 'package:immich_mobile/presentation/router/router.dart';
import 'package:watch_it/watch_it.dart';

class ImmichApp extends StatefulWidget {
  final ThemeData lightTheme;
  final ThemeData darkTheme;

  const ImmichApp({
    required this.lightTheme,
    required this.darkTheme,
    super.key,
  });

  @override
  State createState() => _ImmichAppState();
}

class _ImmichAppState extends State<ImmichApp> with WidgetsBindingObserver {
  @override
  Widget build(BuildContext context) {
    final router = di<AppRouter>();

    return MaterialApp.router(
      locale: TranslationProvider.of(context).flutterLocale,
      supportedLocales: AppLocaleUtils.supportedLocales,
      localizationsDelegates: GlobalMaterialLocalizations.delegates,
      theme: widget.lightTheme,
      darkTheme: widget.darkTheme,
      routerConfig: router.config(),
    );
  }
}
