import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';

class NotificationSetting extends HookConsumerWidget {
  const NotificationSetting({
    Key? key,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final appSettingService = ref.watch(appSettingsServiceProvider);

    final sliderValue = useState(0.0);

    useEffect(
      () {
        sliderValue.value = appSettingService
            .getSetting<int>(AppSettingsEnum.uploadErrorNotificationGracePeriod)
            .toDouble();
        return null;
      },
      [],
    );

    final String formattedValue = _formatSliderValue(sliderValue.value);
    return ExpansionTile(
      textColor: Theme.of(context).primaryColor,
      title: const Text(
        'setting_notifications_title',
        style: TextStyle(
          fontWeight: FontWeight.bold,
        ),
      ).tr(),
      subtitle: const Text(
        'setting_notifications_subtitle',
        style: TextStyle(
          fontSize: 13,
        ),
      ).tr(),
      children: [
        ListTile(
          isThreeLine: false,
          dense: true,
          title: const Text(
            'setting_notifications_notify_failures_grace_period',
            style: TextStyle(fontWeight: FontWeight.bold),
          ).tr(args: [formattedValue]),
          subtitle: Slider(
            value: sliderValue.value,
            onChanged: (double v) => sliderValue.value = v,
            onChangeEnd: (double v) => appSettingService.setSetting(
                AppSettingsEnum.uploadErrorNotificationGracePeriod, v.toInt()),
            max: 5.0,
            divisions: 5,
            label: formattedValue,
            activeColor: Theme.of(context).primaryColor,
          ),
        ),
      ],
    );
  }
}

String _formatSliderValue(double v) {
  if (v == 0.0) {
    return 'setting_notifications_notify_immediately'.tr();
  } else if (v == 1.0) {
    return 'setting_notifications_notify_minutes'.tr(args: const ['30']);
  } else if (v == 2.0) {
    return 'setting_notifications_notify_hours'.tr(args: const ['2']);
  } else if (v == 3.0) {
    return 'setting_notifications_notify_hours'.tr(args: const ['8']);
  } else if (v == 4.0) {
    return 'setting_notifications_notify_hours'.tr(args: const ['24']);
  } else {
    return 'setting_notifications_notify_never'.tr();
  }
}
