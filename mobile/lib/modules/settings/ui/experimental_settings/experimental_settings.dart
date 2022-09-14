import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';

class ExperimentalSettings extends HookConsumerWidget {
  const ExperimentalSettings({
    Key? key,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final appSettingService = ref.watch(appSettingsServiceProvider);

    final useExperimentalCaching = useState(false);

    useEffect(
      () {
        useExperimentalCaching.value = appSettingService
            .getSetting(AppSettingsEnum.useExperimentalCacheRepo);
        return null;
      },
      [],
    );

    void onSwitchChanged(bool value) {
      useExperimentalCaching.value = value;
      appSettingService.setSetting(
          AppSettingsEnum.useExperimentalCacheRepo, value);
    }

    return ExpansionTile(
      textColor: Theme.of(context).primaryColor,
      title: const Text(
        'setting_experimental_title',
        style: TextStyle(
          fontWeight: FontWeight.bold,
        ),
      ).tr(),
      subtitle: const Text(
        'setting_experimental_subtitle',
        style: TextStyle(
          fontSize: 13,
        ),
      ).tr(),
      children: [
        SwitchListTile.adaptive(
          activeColor: Theme.of(context).primaryColor,
          title: const Text(
            "setting_experimental_cache_title",
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ).tr(),
          subtitle: const Text(
            "setting_experimental_cache_subtitle",
            style: TextStyle(
              fontSize: 12,
            ),
          ).tr(),
          value: useExperimentalCaching.value,
          onChanged: onSwitchChanged,
        )
      ],
    );
  }
}
