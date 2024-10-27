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
            scaffoldMessengerKey: kScafMessengerKey,
            routerConfig: di<AppRouter>().config(),
            theme: lightTheme,
            darkTheme: darkTheme,
            locale: TranslationProvider.of(ctx).flutterLocale,
            localizationsDelegates: GlobalMaterialLocalizations.delegates,
            supportedLocales: AppLocaleUtils.supportedLocales,
            debugShowCheckedModeBanner: false,
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
      return builder(
        context,
        theme.generateThemeData(),
        theme.generateThemeData(brightness: Brightness.dark),
      );
    }

    // Dynamic color builder
    return DynamicColorBuilder(builder: (lightDynamic, darkDynamic) {
      if (lightDynamic == null || darkDynamic == null) {
        final defaultTheme = AppTheme.blue;
        return builder(
          context,
          defaultTheme.generateThemeData(),
          defaultTheme.generateThemeData(brightness: Brightness.dark),
        );
      }

      final primaryLight = lightDynamic.primary;
      final primaryDark = darkDynamic.primary;

      final lightColor = ColorScheme.fromSeed(seedColor: primaryLight);
      final darkColor = ColorScheme.fromSeed(
        seedColor: primaryDark,
        brightness: Brightness.dark,
      );

      return builder(
        context,
        AppTheme.generateThemeDataForColorScheme(lightColor),
        AppTheme.generateThemeDataForColorScheme(
          darkColor,
          brightness: Brightness.dark,
        ),
      );
    });
  }
}
