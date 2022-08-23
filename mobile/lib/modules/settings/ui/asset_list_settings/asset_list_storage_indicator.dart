import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';

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

      ref.invalidate(assetGroupByDateTimeProvider);
    }

    useEffect(
      () {
        showStorageIndicator.value = appSettingService.getSetting<bool>(AppSettingsEnum.storageIndicator);

        return null;
      },
      [],
    );

    return SwitchListTile.adaptive(
      activeColor: Theme.of(context).primaryColor,
      title: const Text(
        "theme_setting_asset_list_storage_indicator_title",
        style: TextStyle(
          fontSize: 12,
        ),
      ).tr(),
      onChanged: switchChanged,
      value: showStorageIndicator.value,
    );
  }
}
