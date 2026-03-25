import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart' hide Store;
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/setting.model.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/infrastructure/setting.provider.dart';
import 'package:immich_mobile/presentation/widgets/timeline/dynamic_layout_threshold.dart';
import 'package:immich_mobile/widgets/settings/setting_group_title.dart';
import 'package:immich_mobile/widgets/settings/settings_slider_list_tile.dart';
import 'package:immich_mobile/widgets/settings/settings_switch_list_tile.dart';

class LayoutSettings extends HookConsumerWidget {
  const LayoutSettings({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final useDynamicLayoutValue = ref.watch(dynamicLayoutSettingProvider).valueOrNull ?? false;
    final tilesPerRowValue = ref.watch(tilesPerRowSettingProvider).valueOrNull ?? Setting.tilesPerRow.defaultValue;
    final useDynamicLayout = useState(useDynamicLayoutValue);
    final tilesPerRow = useState(tilesPerRowValue);
    final configuredThreshold = ref.watch(timelineDynamicLayoutThresholdProvider).value;
    final dynamicLayoutThreshold = useState(
      resolveTimelineDynamicLayoutThreshold(isMobile: context.isMobile, configuredThreshold: configuredThreshold),
    );

    useEffect(() {
      dynamicLayoutThreshold.value = resolveTimelineDynamicLayoutThreshold(
        isMobile: context.isMobile,
        configuredThreshold: configuredThreshold,
      );
      return null;
    }, [configuredThreshold, context.isMobile]);

    useEffect(() {
      useDynamicLayout.value = useDynamicLayoutValue;
      return null;
    }, [useDynamicLayoutValue]);

    useEffect(() {
      tilesPerRow.value = tilesPerRowValue;
      return null;
    }, [tilesPerRowValue]);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SettingGroupTitle(
          title: "asset_list_layout_sub_title".t(context: context),
          icon: Icons.view_module_outlined,
        ),
        if (!Store.isBetaTimelineEnabled)
          SettingsSwitchListTile(
            valueNotifier: useDynamicLayout,
            title: "asset_list_layout_settings_dynamic_layout_title".t(context: context),
            onChanged: (value) => ref.read(settingsProvider.notifier).set(Setting.dynamicLayout, value),
          ),
        if (Store.isBetaTimelineEnabled)
          SettingsSliderListTile(
            valueNotifier: dynamicLayoutThreshold,
            text: 'Dynamic layout threshold (${dynamicLayoutThreshold.value} columns)',
            label: "${dynamicLayoutThreshold.value}",
            maxValue: kTimelineDynamicLayoutMaxThreshold.toDouble(),
            minValue: kTimelineDynamicLayoutMinThreshold.toDouble(),
            noDivisons: kTimelineDynamicLayoutMaxThreshold - kTimelineDynamicLayoutMinThreshold,
            onChangeEnd: (value) async {
              await Store.put(StoreKey.timelineDynamicLayoutThreshold, value);
            },
          ),
        SettingsSliderListTile(
          valueNotifier: tilesPerRow,
          text: 'theme_setting_asset_list_tiles_per_row_title'.tr(namedArgs: {'count': "${tilesPerRow.value}"}),
          label: "${tilesPerRow.value}",
          maxValue: 6,
          minValue: 2,
          noDivisons: 4,
          onChangeEnd: (value) => ref.read(settingsProvider.notifier).set(Setting.tilesPerRow, value),
        ),
      ],
    );
  }
}
