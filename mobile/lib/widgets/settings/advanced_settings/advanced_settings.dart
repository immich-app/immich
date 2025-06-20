import 'dart:io';

import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart' hide Store;
import 'package:hooks_riverpod/hooks_riverpod.dart';

import 'package:immich_mobile/widgets/settings/advanced_settings/alternate_media_filter.dart';
import 'package:immich_mobile/widgets/settings/advanced_settings/log_level_setting.dart';
import 'package:immich_mobile/widgets/settings/advanced_settings/remote_image_preference.dart';
import 'package:immich_mobile/widgets/settings/advanced_settings/self_signed_ssl_cert.dart';
import 'package:immich_mobile/widgets/settings/advanced_settings/sync_remote_deletions.dart';
import 'package:immich_mobile/widgets/settings/advanced_settings/troubleshooting_setting.dart';
import 'package:immich_mobile/widgets/settings/advanced_settings/local_storage_settings.dart';
import 'package:immich_mobile/widgets/settings/advanced_settings/ssl_client_cert_settings.dart';
import 'package:immich_mobile/widgets/settings/core/setting_section_header.dart';
import 'package:immich_mobile/widgets/settings/custom_proxy_headers_settings/custom_proxy_headers_settings.dart';
import 'package:immich_mobile/widgets/settings/layouts/settings_card_layout.dart';
import 'package:immich_mobile/widgets/settings/layouts/settings_sub_page_scaffold.dart';

class AdvancedSettings extends HookConsumerWidget {
  const AdvancedSettings({super.key});

  static Future<bool> _checkAndroidVersion() async {
    if (Platform.isAndroid) {
      DeviceInfoPlugin deviceInfo = DeviceInfoPlugin();
      AndroidDeviceInfo androidInfo = await deviceInfo.androidInfo;
      int sdkVersion = androidInfo.version.sdkInt;
      return sdkVersion >= 31;
    }
    return false;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isAndroid31Plus = useFuture(useMemoized(_checkAndroidVersion, []));

    final advancedSettings = [
      const SettingsCardLayout(
        header: SettingSectionHeader(
          title: "Placeholder",
        ),
        children: [
          TroubleshootingSetting(),
          LogLevelSetting(),
        ],
      ),
      if (isAndroid31Plus.hasData && isAndroid31Plus.data == true)
        const SyncRemoteDeletionsSetting(),
      const RemoteImagePreferenceSetting(),
      const LocalStorageSettings(),
      const SelfSignedSSLCertSetting(),
      const SslClientCertSettings(),
      const CustomProxyHeaderSettings(),
      const AlternateMediaFilterSetting(),
    ];

    return SettingsSubPageScaffold(settings: advancedSettings);
  }
}
