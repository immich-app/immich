import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';

class StorageIndicator extends HookConsumerWidget {
  const StorageIndicator({
    Key? key,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final appSettingService = ref.watch(appSettingsServiceProvider);

    final showStorageIndicator = useState(true);

    void switchChanged(bool value) {
      appSettingService.setSetting(AppSettingsEnum.storageIndicator, value);
      showStorageIndicator.value = value;
      ref.invalidate(appSettingsServiceProvider);
    }

    useEffect(
      () {
        showStorageIndicator.value = appSettingService
            .getSetting<bool>(AppSettingsEnum.storageIndicator);

        return null;
      },
      [],
    );

    return SwitchListTile.adaptive(
      activeColor: context.primaryColor,
      title: Text(
        "theme_setting_asset_list_storage_indicator_title",
        style:
            context.textTheme.labelLarge?.copyWith(fontWeight: FontWeight.bold),
      ).tr(),
      onChanged: switchChanged,
      value: showStorageIndicator.value,
    );
  }
}
