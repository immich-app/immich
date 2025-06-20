import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/utils/fade_on_tap.dart';
import 'package:immich_mobile/widgets/settings/core/setting_section_header.dart';
import 'package:immich_mobile/widgets/settings/layouts/settings_card_layout.dart';

class CustomProxyHeaderSettings extends StatelessWidget {
  const CustomProxyHeaderSettings({super.key});

  @override
  Widget build(BuildContext context) {
    return SettingsCardLayout(
      header: const SettingSectionHeader(
        title: "Placeholder",
      ),
      children: [
        FadeOnTap(
          onTap: () => context.pushRoute(const HeaderSettingsRoute()),
          child: ListTile(
            contentPadding: EdgeInsets.zero,
            title: Text('headers_settings_tile_title'.t(context: context)),
            titleTextStyle: context.itemTitle,
            subtitle:
                Text('headers_settings_tile_subtitle'.t(context: context)),
            subtitleTextStyle: context.itemSubtitle,
            trailing: Icon(
              Icons.chevron_right,
              color: context.colorScheme.onSurface.withValues(alpha: 0.4),
              size: 18,
            ),
          ),
        ),
      ],
    );
  }
}
