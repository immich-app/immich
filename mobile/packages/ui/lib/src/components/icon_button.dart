import 'dart:async';

import 'package:flutter/material.dart';
import 'package:immich_ui/immich_ui.dart';
import 'package:immich_ui/src/internal.dart';

class ImmichIconButton extends StatefulWidget {
  final IconData icon;
  final FutureOr<void> Function() onPressed;
  final ImmichVariant variant;
  final ImmichColor color;
  final bool disabled;
  final bool? loading;

  const ImmichIconButton({
    super.key,
    required this.icon,
    required this.onPressed,
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

  Future<void> _onPressed() async {
    setState(() => _loading = true);
    try {
      await widget.onPressed();
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

    return IconButton(
      icon: _isLoading
          ? const SizedBox.square(
              dimension: ImmichIconSize.sm,
              child: CircularProgressIndicator(strokeWidth: ImmichBorderWidth.md),
            )
          : Icon(widget.icon),
      onPressed: widget.disabled || _isLoading ? null : _onPressed,
      style: IconButton.styleFrom(backgroundColor: background, foregroundColor: foreground),
    );
  }
}
