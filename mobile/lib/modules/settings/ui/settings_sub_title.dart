import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';

class SettingsSubTitle extends StatelessWidget {
  final String title;

  const SettingsSubTitle({
    super.key,
    required this.title,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 20),
      child: Text(
        title,
        style: context.textTheme.bodyLarge?.copyWith(
          color: context.primaryColor,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}
