import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/theme.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/widgets/settings/preference_settings/primary_color_setting.dart';
import 'package:immich_mobile/widgets/settings/settings_sub_title.dart';
import 'package:immich_mobile/widgets/settings/settings_switch_list_tile.dart';
import 'package:immich_mobile/utils/hooks/app_settings_update_hook.dart';

class ThemeSetting extends HookConsumerWidget {
  const ThemeSetting({
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentThemeString = useAppSettingsState(AppSettingsEnum.themeMode);
    final currentTheme = useValueNotifier(ref.read(immichThemeModeProvider));
    final isDarkTheme = useValueNotifier(currentTheme.value == ThemeMode.dark);
    final isSystemTheme =
        useValueNotifier(currentTheme.value == ThemeMode.system);

    final applyThemeToBackgroundSetting =
        useAppSettingsState(AppSettingsEnum.colorfulInterface);
    final applyThemeToBackgroundProvider =
        useValueNotifier(ref.read(colorfulInterfaceSettingProvider));

    useValueChanged(
      currentThemeString.value,
      (_, __) => currentTheme.value = switch (currentThemeString.value) {
        "light" => ThemeMode.light,
        "dark" => ThemeMode.dark,
        _ => ThemeMode.system,
      },
    );

    useValueChanged(
      applyThemeToBackgroundSetting.value,
      (_, __) => applyThemeToBackgroundProvider.value =
          applyThemeToBackgroundSetting.value,
    );

    void onThemeChange(bool isDark) {
      if (isDark) {
        ref.watch(immichThemeModeProvider.notifier).state = ThemeMode.dark;
        currentThemeString.value = "dark";
      } else {
        ref.watch(immichThemeModeProvider.notifier).state = ThemeMode.light;
        currentThemeString.value = "light";
      }
    }

    void onSystemThemeChange(bool isSystem) {
      if (isSystem) {
        currentThemeString.value = "system";
        isSystemTheme.value = true;
        ref.watch(immichThemeModeProvider.notifier).state = ThemeMode.system;
      } else {
        final currentSystemBrightness = context.platformBrightness;
        isSystemTheme.value = false;
        isDarkTheme.value = currentSystemBrightness == Brightness.dark;
        if (currentSystemBrightness == Brightness.light) {
          currentThemeString.value = "light";
          ref.watch(immichThemeModeProvider.notifier).state = ThemeMode.light;
        } else if (currentSystemBrightness == Brightness.dark) {
          currentThemeString.value = "dark";
          ref.watch(immichThemeModeProvider.notifier).state = ThemeMode.dark;
        }
      }
    }

    void onSurfaceColorSettingChange(bool useColorfulInterface) {
      applyThemeToBackgroundSetting.value = useColorfulInterface;
      ref.watch(colorfulInterfaceSettingProvider.notifier).state =
          useColorfulInterface;
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SettingsSubTitle(title: "theme".tr()),
        SettingsSwitchListTile(
          valueNotifier: isSystemTheme,
          title: 'theme_setting_system_theme_switch'.tr(),
          onChanged: onSystemThemeChange,
        ),
        if (currentTheme.value != ThemeMode.system)
          SettingsSwitchListTile(
            valueNotifier: isDarkTheme,
            title: 'map_settings_dark_mode'.tr(),
            onChanged: onThemeChange,
          ),
        const PrimaryColorSetting(),
        SettingsSwitchListTile(
          valueNotifier: applyThemeToBackgroundProvider,
          title: "theme_setting_colorful_interface_title".tr(),
          subtitle: 'theme_setting_colorful_interface_subtitle'.tr(),
          onChanged: onSurfaceColorSettingChange,
        ),
      ],
    );
  }
}
