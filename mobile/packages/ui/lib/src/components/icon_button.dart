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
  bool _running = false;
  bool get _isLoading => widget.loading ?? _running;
  bool get _isDisabled => widget.disabled || _isLoading;

  Future<void> _runAction(FutureOr<void> Function() action) async {
    setState(() => _running = true);
    try {
      await action();
    } finally {
      if (mounted) {
        setState(() => _running = false);
      }
    }
  }

  Future<void>? _onPressed() {
    if (_isDisabled) {
      return null;
    }

    return _runAction(widget.onPressed);
  }

  Future<void>? _onLongPress() {
    if (_isDisabled || widget.onLongPress == null) {
      return null;
    }

    return _runAction(widget.onLongPress!);
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
      onPressed: _onPressed,
      onLongPress: _onLongPress,
      style: IconButton.styleFrom(backgroundColor: background, foregroundColor: foreground),
    );
  }
}
