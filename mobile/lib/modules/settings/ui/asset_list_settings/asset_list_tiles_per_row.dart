import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';

class TilesPerRow extends HookConsumerWidget {
  const TilesPerRow({
    Key? key,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final appSettingService = ref.watch(appSettingsServiceProvider);

    final itemsValue = useState(4.0);

    void sliderChanged(double value) {
      appSettingService.setSetting(AppSettingsEnum.tilesPerRow, value.toInt());
      itemsValue.value = value;
      ref.invalidate(appSettingsServiceProvider);
    }

    useEffect(
      () {
        int tilesPerRow =
            appSettingService.getSetting(AppSettingsEnum.tilesPerRow);
        itemsValue.value = tilesPerRow.toDouble();
        return null;
      },
      [],
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ListTile(
          title: const Text(
            "theme_setting_asset_list_tiles_per_row_title",
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
            ),
          ).tr(args: ["${itemsValue.value.toInt()}"]),
        ),
        Slider(
          onChanged: sliderChanged,
          value: itemsValue.value,
          min: 2,
          max: 6,
          divisions: 4,
          label: "${itemsValue.value.toInt()}",
          activeColor: context.primaryColor,
        ),
      ],
    );
  }
}
