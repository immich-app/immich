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
    Key? key,
    required this.label,
    required this.iconData,
    this.onPressed,
  }) : super(key: key);

  final String label;
  final IconData iconData;
  final void Function()? onPressed;

  @override
  Widget build(BuildContext context) {
    return MaterialButton(
      padding: const EdgeInsets.all(10),
      shape: const CircleBorder(),
      onPressed: onPressed,
      minWidth: 75.0,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Icon(iconData, size: 24),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(fontSize: 12.0),
          ),
        ],
      ),
    );
  }
}
