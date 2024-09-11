import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';

class CustomDraggingHandle extends StatelessWidget {
  const CustomDraggingHandle({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 4,
      width: 30,
      decoration: BoxDecoration(
        color: context.themeData.dividerColor,
        borderRadius: const BorderRadius.all(Radius.circular(20)),
      ),
    );
  }
}

class ControlBoxButton extends StatelessWidget {
  const ControlBoxButton({
    super.key,
    required this.label,
    required this.iconData,
    this.onPressed,
    this.onLongPressed,
  });

  final String label;
  final IconData iconData;
  final void Function()? onPressed;
  final void Function()? onLongPressed;

  @override
  Widget build(BuildContext context) {
    return MaterialButton(
      padding: const EdgeInsets.all(10),
      shape: const CircleBorder(),
      onPressed: onPressed,
      onLongPress: onLongPressed,
      minWidth: 75.0,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Icon(iconData, size: 24),
          const SizedBox(height: 8),
          Text(
            label,
            style: const TextStyle(fontSize: 12.0),
            maxLines: 2,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
