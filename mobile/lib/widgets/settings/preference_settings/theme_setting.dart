import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/widgets/settings/settings_sub_title.dart';
import 'package:immich_mobile/widgets/settings/settings_switch_list_tile.dart';
import 'package:immich_mobile/utils/hooks/app_settings_update_hook.dart';
import 'package:immich_mobile/utils/immich_app_theme.dart';

class ThemeSetting extends HookConsumerWidget {
  const ThemeSetting({
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentThemeString = useAppSettingsState(AppSettingsEnum.themeMode);
    final currentTheme = useValueNotifier(ref.read(immichThemeProvider));
    final isDarkTheme = useValueNotifier(currentTheme.value == ThemeMode.dark);
    final isSystemTheme =
        useValueNotifier(currentTheme.value == ThemeMode.system);

    useValueChanged(
      currentThemeString.value,
      (_, __) => currentTheme.value = switch (currentThemeString.value) {
        "light" => ThemeMode.light,
        "dark" => ThemeMode.dark,
        _ => ThemeMode.system,
      },
    );

    void onThemeChange(bool isDark) {
      if (isDark) {
        ref.watch(immichThemeProvider.notifier).state = ThemeMode.dark;
        currentThemeString.value = "dark";
      } else {
        ref.watch(immichThemeProvider.notifier).state = ThemeMode.light;
        currentThemeString.value = "light";
      }
    }

    void onSystemThemeChange(bool isSystem) {
      if (isSystem) {
        currentThemeString.value = "system";
        isSystemTheme.value = true;
        ref.watch(immichThemeProvider.notifier).state = ThemeMode.system;
      } else {
        final currentSystemBrightness =
            MediaQuery.platformBrightnessOf(context);
        isSystemTheme.value = false;
        isDarkTheme.value = currentSystemBrightness == Brightness.dark;
        if (currentSystemBrightness == Brightness.light) {
          currentThemeString.value = "light";
          ref.watch(immichThemeProvider.notifier).state = ThemeMode.light;
        } else if (currentSystemBrightness == Brightness.dark) {
          currentThemeString.value = "dark";
          ref.watch(immichThemeProvider.notifier).state = ThemeMode.dark;
        }
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SettingsSubTitle(title: "theme_setting_theme_title".tr()),
        SettingsSwitchListTile(
          valueNotifier: isSystemTheme,
          title: 'theme_setting_system_theme_switch'.tr(),
          onChanged: onSystemThemeChange,
        ),
        if (currentTheme.value != ThemeMode.system)
          SettingsSwitchListTile(
            valueNotifier: isDarkTheme,
            title: 'theme_setting_dark_mode_switch'.tr(),
            onChanged: onThemeChange,
          ),
      ],
    );
  }
}
