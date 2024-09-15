import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:immich_mobile/i18n/strings.g.dart';
import 'package:immich_mobile/presentation/modules/theme/models/app_theme.model.dart';
import 'package:immich_mobile/presentation/modules/theme/states/app_theme.state.dart';
import 'package:immich_mobile/presentation/modules/theme/widgets/app_theme_builder.widget.dart';
import 'package:immich_mobile/presentation/router/router.dart';
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
      child: BlocBuilder<AppThemeCubit, AppTheme>(
        bloc: di(),
        builder: (_, appTheme) => AppThemeBuilder(
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
