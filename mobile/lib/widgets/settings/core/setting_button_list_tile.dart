import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';

class SettingButtonListTile extends StatelessWidget {
  final Icon? icon;
  final String? title;
  final Widget? subtitle;
  final String? subtileText;
  final String buttonText;
  final Widget? child;
  final void Function()? onButtonTap;

  const SettingButtonListTile({
    this.title,
    this.icon,
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
      contentPadding: EdgeInsets.zero,
      isThreeLine: true,
      leading: icon,
      title: title != null
          ? Text(
              title!,
              style: context.itemTitle,
            )
          : null,
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (subtileText != null)
            Text(subtileText!, style: context.itemSubtitle),
          if (subtitle != null) subtitle!,
          const SizedBox(height: 8),
          Center(
            child: child ??
                ElevatedButton(onPressed: onButtonTap, child: Text(buttonText)),
          ),
        ],
      ),
    );
  }
}
