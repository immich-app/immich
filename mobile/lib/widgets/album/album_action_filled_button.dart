import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';

class AlbumActionFilledButton extends StatelessWidget {
  final VoidCallback? onPressed;
  final String labelText;
  final IconData iconData;

  const AlbumActionFilledButton({
    super.key,
    this.onPressed,
    required this.labelText,
    required this.iconData,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8.0),
      child: OutlinedButton.icon(
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 0, horizontal: 16),
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.all(Radius.circular(20)),
          ),
          side: BorderSide(
            color: context.colorScheme.surfaceContainerHighest,
            width: 1,
          ),
          backgroundColor: context.colorScheme.surfaceContainerHigh,
        ),
        icon: Icon(
          iconData,
          size: 18,
          color: context.primaryColor,
        ),
        label: Text(
          labelText,
          style: context.textTheme.labelLarge?.copyWith(),
        ),
        onPressed: onPressed,
      ),
    );
  }
}
