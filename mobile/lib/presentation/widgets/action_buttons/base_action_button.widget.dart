import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';

class BaseActionButton extends StatelessWidget {
  const BaseActionButton({
    super.key,
    required this.label,
    required this.iconData,
    this.onPressed,
    this.onLongPressed,
    this.maxWidth = 90.0,
  });

  final String label;
  final IconData iconData;
  final double maxWidth;
  final void Function()? onPressed;
  final void Function()? onLongPressed;

  @override
  Widget build(BuildContext context) {
    final minWidth = context.isMobile ? context.width / 4.5 : 75.0;

    return ConstrainedBox(
      constraints: BoxConstraints(
        maxWidth: maxWidth,
      ),
      child: MaterialButton(
        padding: const EdgeInsets.all(10),
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(20)),
        ),
        onPressed: onPressed,
        onLongPress: onLongPressed,
        minWidth: minWidth,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.start,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Icon(iconData, size: 24),
            const SizedBox(height: 8),
            Text(
              label,
              style:
                  const TextStyle(fontSize: 14.0, fontWeight: FontWeight.w400),
              maxLines: 3,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
