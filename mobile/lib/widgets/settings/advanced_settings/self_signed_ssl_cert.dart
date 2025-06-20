import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/utils/hooks/app_settings_update_hook.dart';
import 'package:immich_mobile/utils/http_ssl_options.dart';
import 'package:immich_mobile/widgets/settings/core/setting_section_header.dart';
import 'package:immich_mobile/widgets/settings/core/setting_switch_list_tile.dart';
import 'package:immich_mobile/widgets/settings/layouts/settings_card_layout.dart';

class SelfSignedSSLCertSetting extends HookConsumerWidget {
  const SelfSignedSSLCertSetting({
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isLoggedIn = ref.read(currentUserProvider) != null;
    final allowSelfSignedSSLCert =
        useAppSettingsState(AppSettingsEnum.allowSelfSignedSSLCert);

    return SettingsCardLayout(
      header: const SettingSectionHeader(
        title: "Placeholder",
      ),
      children: [
        SettingSwitchListTile(
          enabled: !isLoggedIn,
          valueNotifier: allowSelfSignedSSLCert,
          title: 'advanced_settings_self_signed_ssl_title'.t(context: context),
          subtitle:
              'advanced_settings_self_signed_ssl_subtitle'.t(context: context),
          onChanged: HttpSSLOptions.applyFromSettings,
        ),
      ],
    );
  }
}
