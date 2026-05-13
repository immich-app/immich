import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/metadata_key.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/providers/infrastructure/metadata.provider.dart';
import 'package:immich_mobile/widgets/settings/setting_group_title.dart';
import 'package:immich_mobile/widgets/settings/settings_radio_list_tile.dart';

class GroupSettings extends HookConsumerWidget {
  const GroupSettings({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final groupBy = useValueNotifier(ref.watch(appConfigProvider.select((s) => s.timeline.groupAssetsBy)));

    Future<void> updateAppSettings(GroupAssetsBy groupBy) async {
      await ref.read(metadataProvider).write(MetadataKey.timelineGroupAssetsBy, groupBy);
      ref.invalidate(appSettingsServiceProvider);
    }

    void changeGroupValue(GroupAssetsBy? value) {
      if (value != null) {
        groupBy.value = value;
        unawaited(updateAppSettings(value));
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SettingGroupTitle(
          title: "asset_list_group_by_sub_title".t(context: context),
          icon: Icons.group_work_outlined,
        ),
        SettingsRadioListTile(
          groups: [
            SettingsRadioGroup(
              title: 'asset_list_layout_settings_group_by_month_day'.t(context: context),
              value: GroupAssetsBy.day,
            ),
            SettingsRadioGroup(
              title: 'month'.t(context: context),
              value: GroupAssetsBy.month,
            ),
            SettingsRadioGroup(
              title: 'asset_list_layout_settings_group_automatically'.t(context: context),
              value: GroupAssetsBy.auto,
            ),
          ],
          groupBy: groupBy.value,
          onRadioChanged: changeGroupValue,
        ),
      ],
    );
  }
}
