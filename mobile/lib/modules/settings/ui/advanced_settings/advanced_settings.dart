import 'package:easy_localization/easy_localization.dart';
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
        "advanced_settings_tile_title",
        style: TextStyle(
          fontWeight: FontWeight.bold,
        ),
      ).tr(),
      subtitle: const Text(
        "advanced_settings_tile_subtitle",
        style: TextStyle(
          fontSize: 13,
        ),
      ).tr(),
      children: [
        SettingsSwitchListTile(
          enabled: true,
          appSettingService: appSettingService,
          valueNotifier: isEnabled,
          settingsEnum: AppSettingsEnum.advancedTroubleshooting,
          title: "advanced_settings_troubleshooting_title".tr(),
          subtitle: "advanced_settings_troubleshooting_subtitle".tr(),
        ),
      ],
    );
  }
}
