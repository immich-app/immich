import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/pages/onboarding/step_layout.widget.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_mobile/widgets/settings/settings_radio_list_tile.dart';
import 'package:immich_ui/immich_ui.dart';

class OnboardingThemeStep extends ConsumerWidget {
  final VoidCallback onNext;

  const OnboardingThemeStep({super.key, required this.onNext});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mode = ref.watch(appConfigProvider.select((config) => config.theme.mode));

    void updateTheme(ThemeMode theme) => ref.read(settingsProvider).write(.themeMode, theme);

    return OnboardingStepLayout(
      icon: Icons.palette_outlined,
      title: context.t.onboarding_theme_title,
      body: SettingsRadioListTile<ThemeMode>(
        groupBy: mode,
        onRadioChanged: (theme) => theme == null ? null : updateTheme(theme),
        groups: <SettingsRadioGroup<ThemeMode>>[
          .new(title: context.t.light, value: .light),
          .new(title: context.t.dark, value: .dark),
          .new(title: context.t.theme_setting_system_theme_switch, value: .system),
        ],
      ),
      actions: [ImmichTextButton(labelText: context.t.continue$, onPressed: onNext)],
    );
  }
}
