import 'dart:async';

import 'package:flutter/material.dart';
import 'package:immich_ui/immich_ui.dart';

class ImmichTextButton extends StatefulWidget {
  final String labelText;
  final IconData? icon;
  final FutureOr<void> Function() onPressed;
  final FutureOr<void> Function()? onLongPress;
  final ImmichVariant variant;
  final bool expanded;
  final bool disabled;
  final bool? loading;

  const ImmichTextButton({
    super.key,
    required this.labelText,
    this.icon,
    required this.onPressed,
    this.onLongPress,
    this.variant = .filled,
    this.expanded = true,

    this.disabled = false,
    this.loading,
  });

  @override
  State<ImmichTextButton> createState() => _ImmichTextButtonState();
}

class _ImmichTextButtonState extends State<ImmichTextButton> {
  bool _loading = false;
  bool get _isLoading => widget.loading ?? _loading;

  Future<void> _run(FutureOr<void> Function() action) async {
    setState(() => _loading = true);
    try {
      await action();
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final Widget? icon = _isLoading
        ? const SizedBox.square(
            dimension: ImmichIconSize.md,
            child: CircularProgressIndicator(strokeWidth: ImmichBorderWidth.lg),
          )
        : widget.icon != null
        ? Icon(widget.icon, fontWeight: .w600)
        : null;

    final label = Text(
      widget.labelText,
      style: const .new(fontSize: ImmichTextSize.body, fontWeight: .bold),
    );
    final style = ElevatedButton.styleFrom(padding: const .symmetric(vertical: ImmichSpacing.md));
    final handlerDisabled = widget.disabled || _isLoading;
    final longPress = widget.onLongPress;
    final onPressed = handlerDisabled ? null : () => _run(widget.onPressed);
    final onLongPress = handlerDisabled || longPress == null ? null : () => _run(longPress);

    final button = switch (widget.variant) {
      ImmichVariant.filled => ElevatedButton.icon(
        style: style,
        onPressed: onPressed,
        onLongPress: onLongPress,
        icon: icon,
        label: label,
      ),
      ImmichVariant.ghost => TextButton.icon(
        style: style,
        onPressed: onPressed,
        onLongPress: onLongPress,
        icon: icon,
        label: label,
      ),
    };

    if (widget.expanded) {
      return SizedBox(width: double.infinity, child: button);
    }
    return button;
  }
}
