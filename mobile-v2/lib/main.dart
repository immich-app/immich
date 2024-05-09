import 'package:flutter/material.dart';
import 'package:immich_mobile/i18n/strings.g.dart';
import 'package:immich_mobile/immich_app.dart';
import 'package:immich_mobile/presentation/theme/states/app_theme.state.dart';
import 'package:immich_mobile/presentation/theme/widgets/app_theme_builder.dart';
import 'package:immich_mobile/service_locator.dart';
import 'package:watch_it/watch_it.dart';

void main() {
  // Ensure the bindings are initialized
  WidgetsFlutterBinding.ensureInitialized();
  // DI Injection
  ServiceLocator.configureServices();
  // Init localization
  LocaleSettings.useDeviceLocale();
  runApp(const MainWidget());
}

class MainWidget extends StatelessWidget with WatchItMixin {
  const MainWidget({super.key});

  @override
  Widget build(BuildContext context) {
    final appTheme = watchIt<AppThemeState>().value;

    return TranslationProvider(
      child: AppThemeBuilder(
        theme: appTheme,
        builder: (lightTheme, darkTheme) =>
            ImmichApp(lightTheme: lightTheme, darkTheme: darkTheme),
      ),
    );
  }
}
