import 'package:flutter/material.dart';

class ImTextButton extends StatelessWidget {
  const ImTextButton({
    super.key,
    this.icon,
    this.onPressed,
    this.isDisabled = false,
    required this.label,
  });

  /// Icon to display if [withIcon] is true
  final IconData? icon;

  /// Flag to disable the button
  final bool isDisabled;

  /// Action to perform on Button press
  final VoidCallback? onPressed;

  /// Label to be displayed in the button
  final String label;

  @override
  Widget build(BuildContext context) {
    if (icon != null) {
      return TextButton.icon(
        onPressed: isDisabled ? null : onPressed,
        icon: Icon(icon),
        label: Text(label),
      );
    }

    return TextButton(onPressed: onPressed, child: Text(label));
  }
}
