import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/routing/router.dart';

class CustomeProxyHeaderSettings extends StatelessWidget {
  const CustomeProxyHeaderSettings({super.key});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 20),
      dense: true,
      title: Text(
        "headers_settings_tile_title".tr(),
        style: context.textTheme.bodyLarge?.copyWith(
          fontWeight: FontWeight.w500,
        ),
      ),
      subtitle: Text(
        "headers_settings_tile_subtitle".tr(),
        style: const TextStyle(
          fontSize: 14,
        ),
      ),
      onTap: () => context.pushRoute(const HeaderSettingsRoute()),
    );
  }
}
