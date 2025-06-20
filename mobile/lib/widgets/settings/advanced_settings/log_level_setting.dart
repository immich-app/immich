import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/log.service.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/utils/hooks/app_settings_update_hook.dart';
import 'package:immich_mobile/widgets/settings/core/setting_slider_list_tile.dart';
import 'package:logging/logging.dart';

class LogLevelSetting extends HookConsumerWidget {
  const LogLevelSetting({
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final levelId = useAppSettingsState(AppSettingsEnum.logLevel);
    final logLevel = Level.LEVELS[levelId.value].name;
    useValueChanged(
      levelId.value,
      (_, __) =>
          LogService.I.setLogLevel(Level.LEVELS[levelId.value].toLogLevel()),
    );

    return SettingSliderListTile(
      title: 'advanced_settings_log_level_title'
          .t(context: context, args: {'level': logLevel}),
      valueNotifier: levelId,
      max: 8,
      min: 1,
      divisions: 7,
      label: logLevel,
    );
  }
}
