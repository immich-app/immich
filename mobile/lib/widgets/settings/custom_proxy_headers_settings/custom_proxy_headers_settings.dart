import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/utils/fade_on_tap.dart';

class CustomProxyHeaderSettings extends StatelessWidget {
  const CustomProxyHeaderSettings({super.key});

  @override
  Widget build(BuildContext context) {
    return FadeOnTap(
      onTap: () => context.pushRoute(const HeaderSettingsRoute()),
      child: ListTile(
        contentPadding: EdgeInsets.zero,
        title: Text("headers_settings_tile_title".tr()),
        titleTextStyle: context.itemTitle,
        subtitle: Text("headers_settings_tile_subtitle".tr()),
        subtitleTextStyle: context.itemSubtitle,
        trailing: Icon(
          Icons.chevron_right,
          color: context.colorScheme.onSurface.withValues(alpha: 0.4),
          size: 18,
        ),
      ),
    );
  }
}
