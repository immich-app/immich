import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class ExperimentalSettings extends HookConsumerWidget {
  const ExperimentalSettings({
    Key? key,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
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
      children: const [
        // SwitchListTile.adaptive(
        //   activeColor: Theme.of(context).primaryColor,
        //   title: const Text(
        //     "experimental_settings_new_asset_list_title",
        //     style: TextStyle(
        //       fontSize: 12,
        //       fontWeight: FontWeight.bold,
        //     ),
        //   ).tr(),
        //   subtitle: const Text(
        //     "experimental_settings_new_asset_list_subtitle",
        //     style: TextStyle(
        //       fontSize: 12,
        //     ),
        //   ).tr(),
        //   value: useExperimentalAssetGrid.value,
        //   onChanged: changeUseExperimentalAssetGrid,
        // ),
      ],
    );
  }
}
