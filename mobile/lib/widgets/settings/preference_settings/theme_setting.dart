import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/metadata_key.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/infrastructure/metadata.provider.dart';
import 'package:immich_mobile/providers/theme.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/utils/hooks/app_settings_update_hook.dart';
import 'package:immich_mobile/widgets/settings/preference_settings/primary_color_setting.dart';
import 'package:immich_mobile/widgets/settings/setting_group_title.dart';
import 'package:immich_mobile/widgets/settings/settings_switch_list_tile.dart';

class ThemeSetting extends HookConsumerWidget {
  const ThemeSetting({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentTheme = useState(ref.read(immichThemeModeProvider));
    final isDarkTheme = useValueNotifier(currentTheme.value == ThemeMode.dark);
    final isSystemTheme = useValueNotifier(currentTheme.value == ThemeMode.system);

    final applyThemeToBackgroundSetting = useAppSettingsState(AppSettingsEnum.colorfulInterface);
    final applyThemeToBackgroundProvider = useValueNotifier(ref.read(colorfulInterfaceSettingProvider));

    useValueChanged(
      applyThemeToBackgroundSetting.value,
      (_, __) => applyThemeToBackgroundProvider.value = applyThemeToBackgroundSetting.value,
    );

    void onThemeChange(bool isDark) {
      if (isDark) {
        ref.watch(immichThemeModeProvider.notifier).state = ThemeMode.dark;
        currentTheme.value = ThemeMode.dark;
      } else {
        ref.watch(immichThemeModeProvider.notifier).state = ThemeMode.light;
        currentTheme.value = ThemeMode.light;
      }
      ref.read(metadataProvider).write(MetadataKey.themeMode, currentTheme.value);
    }

    void onSystemThemeChange(bool isSystem) {
      if (isSystem) {
        currentTheme.value = ThemeMode.system;
        isSystemTheme.value = true;
        ref.watch(immichThemeModeProvider.notifier).state = ThemeMode.system;
      } else {
        final currentSystemBrightness = context.platformBrightness;
        isSystemTheme.value = false;
        isDarkTheme.value = currentSystemBrightness == Brightness.dark;
        if (currentSystemBrightness == Brightness.light) {
          currentTheme.value = ThemeMode.light;
          ref.watch(immichThemeModeProvider.notifier).state = ThemeMode.light;
        } else if (currentSystemBrightness == Brightness.dark) {
          currentTheme.value = ThemeMode.dark;
          ref.watch(immichThemeModeProvider.notifier).state = ThemeMode.dark;
        }
      }
      ref.read(metadataProvider).write(MetadataKey.themeMode, currentTheme.value);
    }

    void onSurfaceColorSettingChange(bool useColorfulInterface) {
      applyThemeToBackgroundSetting.value = useColorfulInterface;
      ref.watch(colorfulInterfaceSettingProvider.notifier).state = useColorfulInterface;
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SettingGroupTitle(
          title: "theme".t(context: context),
          icon: Icons.color_lens_outlined,
        ),
        SettingsSwitchListTile(
          valueNotifier: isSystemTheme,
          title: 'theme_setting_system_theme_switch'.t(context: context),
          onChanged: onSystemThemeChange,
        ),
        if (currentTheme.value != ThemeMode.system)
          SettingsSwitchListTile(
            valueNotifier: isDarkTheme,
            title: 'map_settings_dark_mode'.t(context: context),
            onChanged: onThemeChange,
          ),
        const PrimaryColorSetting(),
        SettingsSwitchListTile(
          valueNotifier: applyThemeToBackgroundProvider,
          title: "theme_setting_colorful_interface_title".t(context: context),
          subtitle: 'theme_setting_colorful_interface_subtitle'.t(context: context),
          onChanged: onSurfaceColorSettingChange,
        ),
      ],
    );
  }
}
