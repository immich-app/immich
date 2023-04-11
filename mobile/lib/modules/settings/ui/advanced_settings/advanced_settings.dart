import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
import 'package:immich_mobile/modules/settings/ui/settings_switch_list_tile.dart';

class AdvancedSettings extends HookConsumerWidget {
  const AdvancedSettings({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final appSettingService = ref.watch(appSettingsServiceProvider);
    final isEnabled =
        useState(AppSettingsEnum.advancedTroubleshooting.defaultValue);

    useEffect(
      () {
        isEnabled.value = appSettingService.getSetting<bool>(
          AppSettingsEnum.advancedTroubleshooting,
        );
        return null;
      },
      [],
    );
    return ExpansionTile(
      textColor: Theme.of(context).primaryColor,
      title: const Text(
        "Advanced",
        style: TextStyle(
          fontWeight: FontWeight.bold,
        ),
      ),
      children: [
        SettingsSwitchListTile(
          enabled: true,
          appSettingService: appSettingService,
          valueNotifier: isEnabled,
          settingsEnum: AppSettingsEnum.advancedTroubleshooting,
          title: "Troubleshooting",
          subtitle: "Enable additional features for troubleshooting",
        ),
      ],
    );
  }
}
