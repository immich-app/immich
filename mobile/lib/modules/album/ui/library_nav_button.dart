import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';

class LibraryNavButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final Function() onClick;

  const LibraryNavButton({
    super.key,
    required this.label,
    required this.icon,
    required this.onClick,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 180.0,
      child: OutlinedButton.icon(
        onPressed: onClick,
        label: Padding(
          padding: const EdgeInsets.only(left: 8.0),
          child: Text(
            label,
            style: TextStyle(
              color: context.isDarkTheme
                  ? Colors.white
                  : Colors.black.withAlpha(200),
            ),
          ).tr(),
        ),
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
          backgroundColor:
              context.isDarkTheme ? Colors.grey[900] : Colors.grey[50],
          side: BorderSide(
            color: context.isDarkTheme ? Colors.grey[800]! : Colors.grey[300]!,
          ),
          alignment: Alignment.centerLeft,
        ),
        icon: Icon(
          icon,
          color: context.primaryColor,
        ),
      ),
    );
  }
}
