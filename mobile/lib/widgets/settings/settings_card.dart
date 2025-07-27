import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';

class SettingsCard extends StatelessWidget {
  const SettingsCard({
    super.key,
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.settingRoute,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final PageRouteInfo settingRoute;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: 16.0,
      ),
      child: Card(
        elevation: 0,
        clipBehavior: Clip.antiAlias,
        color: context.colorScheme.surfaceContainer,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(16)),
        ),
        margin: const EdgeInsets.symmetric(vertical: 4.0),
        child: ListTile(
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16.0,
          ),
          leading: Container(
            decoration: BoxDecoration(
              borderRadius: const BorderRadius.all(Radius.circular(16)),
              color: context.isDarkTheme ? Colors.black26 : Colors.white.withAlpha(100),
            ),
            padding: const EdgeInsets.all(16.0),
            child: Icon(icon, color: context.primaryColor),
          ),
          title: Text(
            title,
            style: context.textTheme.titleMedium!.copyWith(
              fontWeight: FontWeight.w600,
              color: context.primaryColor,
            ),
          ),
          subtitle: Text(
            subtitle,
            style: context.textTheme.labelLarge,
          ),
          onTap: () => context.pushRoute(settingRoute),
        ),
      ),
    );
  }
}
