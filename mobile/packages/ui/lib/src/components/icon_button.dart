import 'dart:async';

import 'package:flutter/material.dart';
import 'package:immich_ui/immich_ui.dart';
import 'package:immich_ui/src/internal.dart';

class ImmichIconButton extends StatefulWidget {
  final IconData icon;
  final FutureOr<void> Function() onPressed;
  final FutureOr<void> Function()? onLongPress;
  final ImmichVariant variant;
  final ImmichColor color;
  final bool disabled;
  final bool? loading;

  const ImmichIconButton({
    super.key,
    required this.icon,
    required this.onPressed,
    this.onLongPress,
    this.color = .primary,
    this.variant = .filled,
    this.disabled = false,
    this.loading,
  });

  @override
  State<ImmichIconButton> createState() => _ImmichIconButtonState();
}

class _ImmichIconButtonState extends State<ImmichIconButton> {
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
    final colorScheme = Theme.of(context).colorScheme;

    final background = switch (widget.variant) {
      .filled => switch (widget.color) {
        .primary => colorScheme.primary,
        .secondary => colorScheme.secondary,
      },
      .ghost => Colors.transparent,
    };

    final foreground =
        context.colorOverride ??
        switch (widget.variant) {
          .filled => switch (widget.color) {
            .primary => colorScheme.onPrimary,
            .secondary => colorScheme.onSecondary,
          },
          .ghost => switch (widget.color) {
            .primary => colorScheme.primary,
            .secondary => colorScheme.secondary,
          },
        };

    final handlerDisabled = widget.disabled || _isLoading;
    final onLongPress = widget.onLongPress;

    return IconButton(
      icon: _isLoading
          ? const SizedBox.square(
              dimension: ImmichIconSize.sm,
              child: CircularProgressIndicator(strokeWidth: ImmichBorderWidth.md),
            )
          : Icon(widget.icon),
      onPressed: handlerDisabled ? null : () => _run(widget.onPressed),
      onLongPress: handlerDisabled || onLongPress == null ? null : () => _run(onLongPress),
      style: IconButton.styleFrom(backgroundColor: background, foregroundColor: foreground),
    );
  }
}
