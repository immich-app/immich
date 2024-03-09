import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';

class SettingsButtonListTile extends StatelessWidget {
  final IconData icon;
  final Color? iconColor;
  final String title;
  final String? subtileText;
  final String buttonText;
  final void Function() onButtonTap;

  const SettingsButtonListTile({
    required this.icon,
    this.iconColor,
    required this.title,
    this.subtileText,
    required this.buttonText,
    required this.onButtonTap,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 20),
      horizontalTitleGap: 20,
      isThreeLine: true,
      leading: Icon(icon, color: iconColor),
      title: Text(title, style: context.textTheme.displayMedium),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (subtileText != null) const SizedBox(height: 4),
          if (subtileText != null)
            Text(subtileText!, style: context.textTheme.bodyMedium),
          const SizedBox(height: 6),
          ElevatedButton(onPressed: onButtonTap, child: Text(buttonText)),
        ],
      ),
    );
  }
}
