import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
import 'package:immich_mobile/shared/ui/immich_toast.dart';

class ExperimentalSettings extends HookConsumerWidget {
  const ExperimentalSettings({
    Key? key,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final appSettingService = ref.watch(appSettingsServiceProvider);

    final useExperimentalAssetGrid = useState(false);

    useEffect(
      () {
        useExperimentalAssetGrid.value = appSettingService
            .getSetting(AppSettingsEnum.useExperimentalAssetGrid);
        return null;
      },
      [],
    );

    void changeUseExperimentalAssetGrid(bool status) {
      useExperimentalAssetGrid.value = status;
      appSettingService.setSetting(
        AppSettingsEnum.useExperimentalAssetGrid,
        status,
      );

      ImmichToast.show(
        context: context,
        msg: "settings_require_restart".tr(),
        gravity: ToastGravity.BOTTOM,
      );
    }

    return ExpansionTile(
      textColor: Theme.of(context).primaryColor,
      title: const Text(
        'experimental_settings_title',
        style: TextStyle(
          fontWeight: FontWeight.bold,
        ),
      ).tr(),
      subtitle: const Text(
        'experimental_settings_subtitle',
        style: TextStyle(
          fontSize: 13,
        ),
      ).tr(),
      children: [
        SwitchListTile.adaptive(
          activeColor: Theme.of(context).primaryColor,
          title: const Text(
            "experimental_settings_new_asset_list_title",
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ).tr(),
          subtitle: const Text(
            "experimental_settings_new_asset_list_subtitle",
            style: TextStyle(
              fontSize: 12,
            ),
          ).tr(),
          value: useExperimentalAssetGrid.value,
          onChanged: changeUseExperimentalAssetGrid,
        ),
      ],
    );
  }
}
