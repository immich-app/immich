import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/settings/ui/image_viewer_quality_setting/three_stage_loading.dart';
import 'package:immich_mobile/shared/services/app_settings.service.dart';
import 'package:immich_mobile/utils/immich_app_theme.dart';

class ThemeSetting extends HookConsumerWidget {
  const ThemeSetting({
    Key? key,
  }) : super(key: key);

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
      textColor: Theme.of(context).primaryColor,
      title: const Text(
        'Theme',
        style: TextStyle(
          fontWeight: FontWeight.bold,
        ),
      ),
      subtitle: const Text(
        'Choose the app\'s theme setting',
        style: TextStyle(
          fontSize: 13,
        ),
      ),
      children: [
        SwitchListTile.adaptive(
          activeColor: Theme.of(context).primaryColor,
          title: const Text(
            'Automatic (Follow system setting)',
            style: TextStyle(
              fontSize: 12.0,
              fontWeight: FontWeight.bold,
            ),
          ),
          value: currentTheme.value == ThemeMode.system,
          onChanged: (bool isSystem) {
            var currentSystemBrightness =
                MediaQuery.of(context).platformBrightness;

            if (isSystem) {
              currentTheme.value = ThemeMode.system;
              ref.watch(immichThemeProvider.notifier).state = ThemeMode.system;
            } else {
              if (currentSystemBrightness == Brightness.light) {
                currentTheme.value = ThemeMode.light;
                ref.watch(immichThemeProvider.notifier).state = ThemeMode.light;
              } else if (currentSystemBrightness == Brightness.dark) {
                currentTheme.value = ThemeMode.dark;
                ref.watch(immichThemeProvider.notifier).state = ThemeMode.dark;
              }
            }
          },
        ),
        if (currentTheme.value != ThemeMode.system)
          SwitchListTile.adaptive(
            activeColor: Theme.of(context).primaryColor,
            title: const Text(
              'Dark Mode',
              style: TextStyle(
                fontSize: 12.0,
                fontWeight: FontWeight.bold,
              ),
            ),
            value: ref.watch(immichThemeProvider) == ThemeMode.dark,
            onChanged: (bool isDark) {
              if (isDark) {
                ref.watch(immichThemeProvider.notifier).state = ThemeMode.dark;
              } else {
                ref.watch(immichThemeProvider.notifier).state = ThemeMode.light;
              }
            },
          ),
      ],
    );
  }
}
