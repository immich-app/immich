import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';

class AlbumActionOutlinedButton extends StatelessWidget {
  final VoidCallback? onPressed;
  final String labelText;
  final IconData iconData;

  const AlbumActionOutlinedButton({
    Key? key,
    this.onPressed,
    required this.labelText,
    required this.iconData,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8.0),
      child: OutlinedButton.icon(
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 0, horizontal: 10),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(25),
          ),
          side: BorderSide(
            width: 1,
            color: context.isDarkTheme
                ? const Color.fromARGB(255, 63, 63, 63)
                : const Color.fromARGB(255, 206, 206, 206),
          ),
        ),
        icon: Icon(
          iconData,
          size: 15,
          color: context.primaryColor,
        ),
        label: Text(
          labelText,
          style: context.textTheme.labelSmall?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        onPressed: onPressed,
      ),
    );
  }
}
