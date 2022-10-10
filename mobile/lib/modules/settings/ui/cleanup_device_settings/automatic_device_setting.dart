import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';

class AutomaticDeviceCleanupWidget extends HookConsumerWidget {
  const AutomaticDeviceCleanupWidget({
    Key? key,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final appSettingService = ref.watch(appSettingsServiceProvider);

    final automaticDeviceCleanup = useState(true);

    void switchChanged(bool value) {
      appSettingService.setSetting(
          AppSettingsEnum.automaticDeviceCleanup, value);
      automaticDeviceCleanup.value = value;
    }

    useEffect(
      () {
        automaticDeviceCleanup.value = appSettingService
            .getSetting<bool>(AppSettingsEnum.automaticDeviceCleanup);

        return null;
      },
      [],
    );

    return Column(
      children: [
        SwitchListTile.adaptive(
          activeColor: Theme.of(context).primaryColor,
          title: const Text(
            "cleanup_device_settings_automatic_title",
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ).tr(),
          onChanged: switchChanged,
          value: automaticDeviceCleanup.value,
        ),

        // from here show other options
        // if(automaticDeviceCleanup.value == true)
      ],
    );
  }
}
