import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';

class SettingsButtonListTile extends StatelessWidget {
  final IconData icon;
  final Color? iconColor;
  final String title;
  final Widget? subtitle;
  final String? subtileText;
  final String buttonText;
  final Widget? child;
  final void Function()? onButtonTap;

  const SettingsButtonListTile({
    required this.icon,
    this.iconColor,
    required this.title,
    this.subtileText,
    this.subtitle,
    required this.buttonText,
    this.child,
    this.onButtonTap,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 20),
      horizontalTitleGap: 20,
      isThreeLine: true,
      leading: Icon(icon, color: iconColor),
      title: Text(
        title,
        style: context.textTheme.bodyLarge?.copyWith(
          fontWeight: FontWeight.w500,
        ),
      ),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (subtileText != null) const SizedBox(height: 4),
          if (subtileText != null)
            Text(
              subtileText!,
              style: context.textTheme.bodyMedium?.copyWith(
                color: context.colorScheme.onSurfaceSecondary,
              ),
            ),
          if (subtitle != null) subtitle!,
          const SizedBox(height: 6),
          child ??
              ElevatedButton(onPressed: onButtonTap, child: Text(buttonText)),
        ],
      ),
    );
  }
}
