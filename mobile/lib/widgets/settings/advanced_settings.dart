import 'dart:io';

import 'package:device_info_plus/device_info_plus.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart' hide Store;
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/log.service.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/repositories/local_files_manager.repository.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/utils/hooks/app_settings_update_hook.dart';
import 'package:immich_mobile/utils/http_ssl_cert_override.dart';
import 'package:immich_mobile/widgets/settings/custom_proxy_headers_settings/custome_proxy_headers_settings.dart';
import 'package:immich_mobile/widgets/settings/local_storage_settings.dart';
import 'package:immich_mobile/widgets/settings/settings_slider_list_tile.dart';
import 'package:immich_mobile/widgets/settings/settings_sub_page_scaffold.dart';
import 'package:immich_mobile/widgets/settings/settings_switch_list_tile.dart';
import 'package:immich_mobile/widgets/settings/ssl_client_cert_settings.dart';
import 'package:logging/logging.dart';

class AdvancedSettings extends HookConsumerWidget {
  const AdvancedSettings({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    bool isLoggedIn = ref.read(currentUserProvider) != null;

    final advancedTroubleshooting =
        useAppSettingsState(AppSettingsEnum.advancedTroubleshooting);
    final manageLocalMediaAndroid =
        useAppSettingsState(AppSettingsEnum.manageLocalMediaAndroid);
    final levelId = useAppSettingsState(AppSettingsEnum.logLevel);
    final preferRemote = useAppSettingsState(AppSettingsEnum.preferRemoteImage);
    final allowSelfSignedSSLCert =
        useAppSettingsState(AppSettingsEnum.allowSelfSignedSSLCert);
    final useAlternatePMFilter =
        useAppSettingsState(AppSettingsEnum.photoManagerCustomFilter);

    final logLevel = Level.LEVELS[levelId.value].name;

    useValueChanged(
      levelId.value,
      (_, __) =>
          LogService.I.setlogLevel(Level.LEVELS[levelId.value].toLogLevel()),
    );

    Future<bool> checkAndroidVersion() async {
      if (Platform.isAndroid) {
        DeviceInfoPlugin deviceInfo = DeviceInfoPlugin();
        AndroidDeviceInfo androidInfo = await deviceInfo.androidInfo;
        int sdkVersion = androidInfo.version.sdkInt;
        return sdkVersion >= 31;
      }
      return false;
    }

    final advancedSettings = [
      SettingsSwitchListTile(
        enabled: true,
        valueNotifier: advancedTroubleshooting,
        title: "advanced_settings_troubleshooting_title".tr(),
        subtitle: "advanced_settings_troubleshooting_subtitle".tr(),
      ),
      FutureBuilder<bool>(
        future: checkAndroidVersion(),
        builder: (context, snapshot) {
          if (snapshot.hasData && snapshot.data == true) {
            return SettingsSwitchListTile(
              enabled: true,
              valueNotifier: manageLocalMediaAndroid,
              title: "advanced_settings_sync_remote_deletions_title".tr(),
              subtitle: "advanced_settings_sync_remote_deletions_subtitle".tr(),
              onChanged: (value) async {
                if (value) {
                  final result = await ref
                      .read(localFilesManagerRepositoryProvider)
                      .requestManageMediaPermission();
                  manageLocalMediaAndroid.value = result;
                }
              },
            );
          } else {
            return const SizedBox.shrink();
          }
        },
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
      const CustomeProxyHeaderSettings(),
      SslClientCertSettings(isLoggedIn: ref.read(currentUserProvider) != null),
      SettingsSwitchListTile(
        valueNotifier: useAlternatePMFilter,
        title: "advanced_settings_enable_alternate_media_filter_title".tr(),
        subtitle:
            "advanced_settings_enable_alternate_media_filter_subtitle".tr(),
      ),
    ];

    return SettingsSubPageScaffold(settings: advancedSettings);
  }
}
