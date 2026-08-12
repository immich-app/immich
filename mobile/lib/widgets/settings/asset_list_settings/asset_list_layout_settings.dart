import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_mobile/widgets/settings/setting_group_title.dart';
import 'package:immich_mobile/widgets/settings/settings_slider_list_tile.dart';

class LayoutSettings extends HookConsumerWidget {
  const LayoutSettings({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tilesPerRow = useState(ref.watch(appConfigProvider.select((s) => s.timeline.tilesPerRow)));
    useValueChanged<int, void>(tilesPerRow.value, (_, __) {
      unawaited(ref.read(settingsProvider).write(.timelineTilesPerRow, tilesPerRow.value));
    });

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SettingGroupTitle(title: context.t.asset_list_layout_sub_title, icon: Icons.view_module_outlined),
        SettingsSliderListTile(
          valueNotifier: tilesPerRow,
          text: context.t.theme_setting_asset_list_tiles_per_row_title(count: tilesPerRow.value),
          label: "${tilesPerRow.value}",
          maxValue: 6,
          minValue: 2,
          noDivisons: 4,
          onChangeEnd: (value) {
            ref.invalidate(appSettingsServiceProvider);
          },
        ),
      ],
    );
  }
}
