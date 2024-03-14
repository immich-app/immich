import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
import 'package:immich_mobile/utils/immich_app_theme.dart';

class ThemeSetting extends HookConsumerWidget {
  const ThemeSetting({
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentTheme = useState<ThemeMode>(ThemeMode.system);

    useEffect(
      () {
        currentTheme.value = ref.read(immichThemeProvider);
        return null;
      },
      [],
    );

    return ExpansionTile(
      textColor: context.primaryColor,
      title: Text(
        'theme_setting_theme_title',
        style: context.textTheme.titleMedium,
      ).tr(),
      subtitle: const Text(
        'theme_setting_theme_subtitle',
      ).tr(),
      children: [
        SwitchListTile.adaptive(
          activeColor: context.primaryColor,
          title: Text(
            'theme_setting_system_theme_switch',
            style: context.textTheme.labelLarge
                ?.copyWith(fontWeight: FontWeight.bold),
          ).tr(),
          value: currentTheme.value == ThemeMode.system,
          onChanged: (bool isSystem) {
            var currentSystemBrightness =
                MediaQuery.of(context).platformBrightness;

            if (isSystem) {
              currentTheme.value = ThemeMode.system;
              ref.watch(immichThemeProvider.notifier).state = ThemeMode.system;
              ref
                  .watch(appSettingsServiceProvider)
                  .setSetting(AppSettingsEnum.themeMode, "system");
            } else {
              if (currentSystemBrightness == Brightness.light) {
                currentTheme.value = ThemeMode.light;
                ref.watch(immichThemeProvider.notifier).state = ThemeMode.light;
                ref
                    .watch(appSettingsServiceProvider)
                    .setSetting(AppSettingsEnum.themeMode, "light");
              } else if (currentSystemBrightness == Brightness.dark) {
                currentTheme.value = ThemeMode.dark;
                ref.watch(immichThemeProvider.notifier).state = ThemeMode.dark;
                ref
                    .watch(appSettingsServiceProvider)
                    .setSetting(AppSettingsEnum.themeMode, "dark");
              }
            }
          },
        ),
        if (currentTheme.value != ThemeMode.system)
          SwitchListTile.adaptive(
            activeColor: context.primaryColor,
            title: Text(
              'theme_setting_dark_mode_switch',
              style: context.textTheme.labelLarge
                  ?.copyWith(fontWeight: FontWeight.bold),
            ).tr(),
            value: ref.watch(immichThemeProvider) == ThemeMode.dark,
            onChanged: (bool isDark) {
              if (isDark) {
                ref.watch(immichThemeProvider.notifier).state = ThemeMode.dark;
                ref
                    .watch(appSettingsServiceProvider)
                    .setSetting(AppSettingsEnum.themeMode, "dark");
              } else {
                ref.watch(immichThemeProvider.notifier).state = ThemeMode.light;
                ref
                    .watch(appSettingsServiceProvider)
                    .setSetting(AppSettingsEnum.themeMode, "light");
              }
            },
          ),
      ],
    );
  }
}
