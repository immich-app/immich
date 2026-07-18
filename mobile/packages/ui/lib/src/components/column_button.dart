import 'dart:async';

import 'package:flutter/material.dart';
import 'package:immich_ui/src/constants.dart';
import 'package:immich_ui/src/internal.dart';

class ImmichColumnButton extends StatefulWidget {
  final IconData icon;
  final String label;
  final FutureOr<void> Function() onPressed;
  final FutureOr<void> Function()? onLongPress;
  final bool disabled;
  final bool? loading;

  const ImmichColumnButton({
    super.key,
    required this.icon,
    required this.label,
    required this.onPressed,
    this.onLongPress,
    this.disabled = false,
    this.loading,
  });

  @override
  State<ImmichColumnButton> createState() => _ImmichColumnButtonState();
}

class _ImmichColumnButtonState extends State<ImmichColumnButton> {
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
    final foreground = context.colorOverride ?? Theme.of(context).colorScheme.onSurface;
    final handlerDisabled = widget.disabled || _isLoading;
    final onLongPress = widget.onLongPress;

    return TextButton(
      onPressed: handlerDisabled ? null : () => _run(widget.onPressed),
      onLongPress: handlerDisabled || onLongPress == null ? null : () => _run(onLongPress),
      style: TextButton.styleFrom(
        foregroundColor: foreground,
        padding: const .symmetric(horizontal: ImmichSpacing.sm, vertical: ImmichSpacing.md),
        tapTargetSize: .shrinkWrap,
        shape: const RoundedRectangleBorder(borderRadius: .all(.circular(ImmichRadius.xl))),
      ),
      child: ConstrainedBox(
        constraints: const .new(maxWidth: 90),
        child: Column(
          mainAxisSize: .min,
          children: [
            _isLoading
                ? const SizedBox.square(
                    dimension: ImmichIconSize.md,
                    child: CircularProgressIndicator(strokeWidth: ImmichBorderWidth.lg),
                  )
                : Icon(widget.icon, size: ImmichIconSize.md),
            const SizedBox(height: ImmichSpacing.sm),
            Text(
              widget.label,
              maxLines: 2,
              textAlign: .center,
              overflow: .ellipsis,
              style: const .new(fontSize: ImmichTextSize.label, fontWeight: .w500),
            ),
          ],
        ),
      ),
    );
  }
}
