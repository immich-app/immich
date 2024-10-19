import 'package:dynamic_color/dynamic_color.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:immich_mobile/i18n/strings.g.dart';
import 'package:immich_mobile/presentation/router/router.dart';
import 'package:immich_mobile/presentation/states/app_theme.state.dart';
import 'package:immich_mobile/presentation/theme/app_theme.dart';
import 'package:immich_mobile/service_locator.dart';
import 'package:immich_mobile/utils/constants/globals.dart';

class ImApp extends StatefulWidget {
  const ImApp({super.key});

  @override
  State createState() => _ImAppState();
}

class _ImAppState extends State<ImApp> with WidgetsBindingObserver {
  _ImAppState();

  @override
  Widget build(BuildContext context) {
    return TranslationProvider(
      child: ValueListenableBuilder(
        valueListenable: di<AppThemeProvider>(),
        builder: (_, appTheme, __) => _AppThemeBuilder(
          theme: appTheme,
          builder: (ctx, lightTheme, darkTheme) => MaterialApp.router(
            debugShowCheckedModeBanner: false,
            locale: TranslationProvider.of(ctx).flutterLocale,
            supportedLocales: AppLocaleUtils.supportedLocales,
            localizationsDelegates: GlobalMaterialLocalizations.delegates,
            theme: lightTheme,
            darkTheme: darkTheme,
            routerConfig: di<AppRouter>().config(),
            scaffoldMessengerKey: kScafMessengerKey,
          ),
        ),
      ),
    );
  }
}

class _AppThemeBuilder extends StatelessWidget {
  const _AppThemeBuilder({required this.theme, required this.builder});

  /// Current app theme to switch the theme data used
  final AppTheme theme;

  /// Builds the child widget of this widget, providing a light and dark [ThemeData] based on the
  /// [theme] passed.
  final Widget Function(
    BuildContext context,
    ThemeData lightTheme,
    ThemeData darkTheme,
  ) builder;

  @override
  Widget build(BuildContext context) {
    // Static colors
    if (theme != AppTheme.dynamic) {
      final lightTheme = AppTheme.generateThemeData(theme.lightSchema);
      final darkTheme = AppTheme.generateThemeData(theme.darkSchema);

      return builder(context, lightTheme, darkTheme);
    }

    // Dynamic color builder
    return DynamicColorBuilder(builder: (lightDynamic, darkDynamic) {
      final lightTheme =
          AppTheme.generateThemeData(lightDynamic ?? theme.lightSchema);
      final darkTheme =
          AppTheme.generateThemeData(darkDynamic ?? theme.darkSchema);

      return builder(context, lightTheme, darkTheme);
    });
  }
}
