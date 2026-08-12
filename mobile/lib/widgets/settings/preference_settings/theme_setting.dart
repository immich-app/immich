import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_mobile/widgets/settings/preference_settings/primary_color_setting.dart';
import 'package:immich_mobile/widgets/settings/setting_group_title.dart';
import 'package:immich_mobile/widgets/settings/settings_switch_list_tile.dart';

class ThemeSetting extends HookConsumerWidget {
  const ThemeSetting({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentTheme = useState(ref.watch(appConfigProvider.select((config) => config.theme.mode)));
    final isDarkTheme = useValueNotifier(currentTheme.value == ThemeMode.dark);
    final isSystemTheme = useValueNotifier(currentTheme.value == ThemeMode.system);
    final colorfulInterface = useValueNotifier(
      ref.watch(appConfigProvider.select((config) => config.theme.colorfulInterface)),
    );

    void onThemeChange(bool isDark) {
      currentTheme.value = isDark ? ThemeMode.dark : ThemeMode.light;
      unawaited(ref.read(settingsProvider).write(.themeMode, currentTheme.value));
    }

    void onSystemThemeChange(bool isSystem) {
      if (isSystem) {
        currentTheme.value = ThemeMode.system;
        isSystemTheme.value = true;
      } else {
        final currentSystemBrightness = context.platformBrightness;
        isSystemTheme.value = false;
        isDarkTheme.value = currentSystemBrightness == Brightness.dark;
        if (currentSystemBrightness == Brightness.light) {
          currentTheme.value = ThemeMode.light;
        } else if (currentSystemBrightness == Brightness.dark) {
          currentTheme.value = ThemeMode.dark;
        }
      }
      unawaited(ref.read(settingsProvider).write(.themeMode, currentTheme.value));
    }

    void onSurfaceColorSettingChange(bool useColorfulInterface) {
      unawaited(ref.read(settingsProvider).write(.themeColorfulInterface, useColorfulInterface));
      colorfulInterface.value = useColorfulInterface;
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SettingGroupTitle(title: context.t.theme, icon: Icons.color_lens_outlined),
        SettingsSwitchListTile(
          valueNotifier: isSystemTheme,
          title: context.t.theme_setting_system_theme_switch,
          onChanged: onSystemThemeChange,
        ),
        if (currentTheme.value != ThemeMode.system)
          SettingsSwitchListTile(
            valueNotifier: isDarkTheme,
            title: context.t.map_settings_dark_mode,
            onChanged: onThemeChange,
          ),
        const PrimaryColorSetting(),
        SettingsSwitchListTile(
          valueNotifier: colorfulInterface,
          title: context.t.theme_setting_colorful_interface_title,
          subtitle: context.t.theme_setting_colorful_interface_subtitle,
          onChanged: onSurfaceColorSettingChange,
        ),
      ],
    );
  }
}
