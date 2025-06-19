import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/widgets/settings/core/setting_permission_request.dart';
import 'package:permission_handler/permission_handler.dart';

class IosPermissionRequest extends StatelessWidget {
  const IosPermissionRequest({super.key});

  @override
  Widget build(BuildContext context) {
    return SettingPermissionRequest(
      useCard: false,
      padding: const EdgeInsets.symmetric(vertical: 8),
      icon: Icons.refresh_rounded,
      title: 'backup_controller_page_background_app_refresh_disabled_title'
          .t(context: context),
      subtitle: 'backup_controller_page_background_app_refresh_disabled_content'
          .t(context: context),
      buttonText:
          'backup_controller_page_background_app_refresh_enable_button_text'
              .t(context: context),
      buttonIcon: Icons.settings_outlined,
      onHandleAction: () => openAppSettings(),
    );
  }
}
