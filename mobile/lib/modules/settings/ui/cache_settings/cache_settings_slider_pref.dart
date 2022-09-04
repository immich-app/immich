import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';

class CacheSettingsSliderPref extends HookConsumerWidget {
  final AppSettingsEnum<int> setting;
  final String translationKey;
  final int min;
  final int max;
  final int divisions;

  const CacheSettingsSliderPref({
    Key? key,
    required this.setting,
    required this.translationKey,
    required this.min,
    required this.max,
    required this.divisions,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final appSettingService = ref.watch(appSettingsServiceProvider);

    final itemsValue = useState(appSettingService.getSetting<int>(setting));

    void sliderChanged(double value) {
      itemsValue.value = value.toInt();
    }

    void sliderChangedEnd(double value) {
      appSettingService.setSetting(setting, value.toInt());
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ListTile(
          title: Text(
            translationKey,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ).tr(args: ["${itemsValue.value.toInt()}"]),
        ),
        Slider(
          onChangeEnd: sliderChangedEnd,
          onChanged: sliderChanged,
          value: itemsValue.value.toDouble(),
          min: min.toDouble(),
          max: max.toDouble(),
          divisions: divisions,
          label: "${itemsValue.value.toInt()}",
          activeColor: Theme.of(context).primaryColor,
        ),
      ],
    );
  }
}
