import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
import 'package:immich_mobile/modules/settings/ui/settings_switch_list_tile.dart';
import 'package:immich_mobile/shared/services/immich_logger.service.dart';
import 'package:logging/logging.dart';

class AdvancedSettings extends HookConsumerWidget {
  const AdvancedSettings({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final appSettingService = ref.watch(appSettingsServiceProvider);
    final isEnabled =
        useState(AppSettingsEnum.advancedTroubleshooting.defaultValue);
    final levelId = useState(AppSettingsEnum.logLevel.defaultValue);

    useEffect(
      () {
        isEnabled.value = appSettingService.getSetting<bool>(
          AppSettingsEnum.advancedTroubleshooting,
        );
        levelId.value = appSettingService.getSetting(AppSettingsEnum.logLevel);
        return null;
      },
      [],
    );

    final logLevel = Level.LEVELS[levelId.value].name;

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
        ListTile(
          dense: true,
          title: Text(
            // Not translated because the levels are only English
            "Log level: $logLevel",
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          subtitle: Slider(
            value: levelId.value.toDouble(),
            onChanged: (double v) => levelId.value = v.toInt(),
            onChangeEnd: (double v) {
              appSettingService.setSetting(
                AppSettingsEnum.logLevel,
                v.toInt(),
              );
              ImmichLogger().level = Level.LEVELS[v.toInt()];
            },
            max: 8,
            min: 1.0,
            divisions: 7,
            label: logLevel,
            activeColor: Theme.of(context).primaryColor,
          ),
        ),
      ],
    );
  }
}
