import 'dart:io';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart' hide Store;
import 'package:immich_mobile/widgets/settings/local_storage_settings.dart';
import 'package:immich_mobile/widgets/settings/settings_slider_list_tile.dart';
import 'package:immich_mobile/widgets/settings/settings_sub_page_scaffold.dart';
import 'package:immich_mobile/widgets/settings/settings_switch_list_tile.dart';
import 'package:immich_mobile/utils/hooks/app_settings_update_hook.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/services/immich_logger.service.dart';
import 'package:immich_mobile/utils/http_ssl_cert_override.dart';
import 'package:logging/logging.dart';

class AdvancedSettings extends HookConsumerWidget {
  const AdvancedSettings({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    bool isLoggedIn = ref.read(currentUserProvider) != null;

    final advancedTroubleshooting =
        useAppSettingsState(AppSettingsEnum.advancedTroubleshooting);
    final levelId = useAppSettingsState(AppSettingsEnum.logLevel);
    final preferRemote = useAppSettingsState(AppSettingsEnum.preferRemoteImage);
    final allowSelfSignedSSLCert =
        useAppSettingsState(AppSettingsEnum.allowSelfSignedSSLCert);

    final logLevel = Level.LEVELS[levelId.value].name;

    useValueChanged(
      levelId.value,
      (_, __) => ImmichLogger().level = Level.LEVELS[levelId.value],
    );

    final advancedSettings = [
      SettingsSwitchListTile(
        enabled: true,
        valueNotifier: advancedTroubleshooting,
        title: "advanced_settings_troubleshooting_title".tr(),
        subtitle: "advanced_settings_troubleshooting_subtitle".tr(),
      ),
      SettingsSliderListTile(
        text: "advanced_settings_log_level_title".tr(args: [logLevel]),
        valueNotifier: levelId,
        maxValue: 8,
        minValue: 1,
        noDivisons: 7,
        label: logLevel,
      ),
      SettingsSwitchListTile(
        valueNotifier: preferRemote,
        title: "advanced_settings_prefer_remote_title".tr(),
        subtitle: "advanced_settings_prefer_remote_subtitle".tr(),
      ),
      const LocalStorageSettings(),
      SettingsSwitchListTile(
        enabled: !isLoggedIn,
        valueNotifier: allowSelfSignedSSLCert,
        title: "advanced_settings_self_signed_ssl_title".tr(),
        subtitle: "advanced_settings_self_signed_ssl_subtitle".tr(),
        onChanged: (_) => HttpOverrides.global = HttpSSLCertOverride(),
      ),
    ];

    return SettingsSubPageScaffold(settings: advancedSettings);
  }
}
