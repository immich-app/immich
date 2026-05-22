import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';

class SettingListTile extends StatelessWidget {
  final String title;
  final String? subtitle;
  final Widget? leading;
  final Widget? trailing;
  final VoidCallback? onTap;
  final EdgeInsetsGeometry? contentPadding;

  const SettingListTile({
    required this.title,
    this.subtitle,
    this.leading,
    this.trailing,
    this.onTap,
    this.contentPadding,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      title: Text(title, style: context.textTheme.bodyLarge!.copyWith(fontWeight: FontWeight.w500, height: 1.5)),
      subtitle: subtitle != null
          ? Text(
              subtitle!,
              style: context.textTheme.bodyMedium!.copyWith(color: context.textTheme.bodyMedium!.color!.withAlpha(215)),
            )
          : null,
      leading: leading,
      trailing: trailing,
      onTap: onTap,
      contentPadding: contentPadding,
    );
  }
}
