import 'package:flutter/material.dart';

class ImFilledButton extends StatelessWidget {
  const ImFilledButton({
    super.key,
    this.icon,
    this.onPressed,
    this.isDisabled = false,
    required this.label,
  }) : _tonal = false;

  const ImFilledButton.tonal({
    super.key,
    this.icon,
    this.onPressed,
    this.isDisabled = false,
    required this.label,
  }) : _tonal = true;

  /// Internal flag to switch between filled and tonal variant
  final bool _tonal;

  /// Should disable the button
  final bool isDisabled;

  /// Icon to display if [withIcon] is true
  final IconData? icon;

  /// Action to perform on Button press
  final VoidCallback? onPressed;

  /// Label to be displayed in the button
  final String label;

  @override
  Widget build(BuildContext context) {
    if (_tonal) {
      if (icon != null) {
        return FilledButton.tonalIcon(
          onPressed: isDisabled ? null : onPressed,
          icon: Icon(icon),
          label: Text(label),
        );
      }

      return FilledButton.tonal(
        onPressed: isDisabled ? null : onPressed,
        child: Text(label),
      );
    }

    if (icon != null) {
      return FilledButton.icon(
        onPressed: isDisabled ? null : onPressed,
        icon: Icon(icon),
        label: Text(label),
      );
    }

    return FilledButton(
      onPressed: isDisabled ? null : onPressed,
      child: Text(label),
    );
  }
}
