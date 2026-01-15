import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/routing/router.dart';

class CustomProxyHeaderSettings extends StatelessWidget {
  const CustomProxyHeaderSettings({super.key});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 20),
      dense: true,
      title: Text(
        context.t.advanced_settings_proxy_headers_title,
        style: context.textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w500),
      ),
      subtitle: Text(
        context.t.advanced_settings_proxy_headers_subtitle,
        style: context.textTheme.bodyMedium?.copyWith(color: context.colorScheme.onSurfaceSecondary),
      ),
      onTap: () => context.pushRoute(const HeaderSettingsRoute()),
    );
  }
}
