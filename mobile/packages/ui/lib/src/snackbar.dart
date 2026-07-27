import 'dart:async';

import 'package:flutter/material.dart';
import 'package:immich_ui/immich_ui.dart';
import 'package:immich_ui/src/internal.dart';

final scaffoldMessengerKey = GlobalKey<ScaffoldMessengerState>();

class SnackbarAction {
  final String? label;
  final FutureOr<void> Function() onPressed;

  const SnackbarAction({this.label, required this.onPressed});
}

class SnackbarManager {
  const SnackbarManager();

  ScaffoldFeatureController<SnackBar, SnackBarClosedReason>? show(
    String message,
    SnackbarType type, {
    Duration? duration,
    SnackbarAction? action,
  }) {
    final messenger = scaffoldMessengerKey.currentState;
    final context = scaffoldMessengerKey.currentContext;
    if (messenger == null || context == null) {
      return null;
    }

    duration ??= const .new(seconds: 4);
    messenger.hideCurrentSnackBar();
    return messenger.showSnackBar(_build(context, message, type, duration, action));
  }

  SnackBar _build(BuildContext context, String message, SnackbarType type, Duration duration, SnackbarAction? action) {
    final theme = Theme.of(context);
    final colors = theme.extension<ImmichColors>() ?? ImmichColors.harmonized(theme.colorScheme);
    final (IconData icon, Color background, Color foreground) = switch (type) {
      .info => (Icons.info_rounded, colors.info, colors.onInfo),
      .success => (Icons.check_circle_rounded, colors.success, colors.onSuccess),
      .error => (Icons.warning_rounded, colors.error, colors.onError),
    };

    SnackBarAction? snackAction;
    if (action != null) {
      snackAction = .new(
        label: action.label ?? context.translations.undo,
        onPressed: action.onPressed,
        textColor: foreground,
      );
    }

    return SnackBar(
      behavior: .floating,
      backgroundColor: background,
      duration: duration,
      shape: const RoundedRectangleBorder(borderRadius: .all(.circular(ImmichRadius.sm))),
      persist: false,
      content: Row(
        children: [
          Icon(icon, color: foreground, size: ImmichIconSize.sm),
          const SizedBox(width: ImmichSpacing.md),
          Expanded(
            child: Text(
              message,
              maxLines: 2,
              overflow: .ellipsis,
              style: .new(color: foreground, fontWeight: .w600, fontSize: ImmichTextSize.body),
            ),
          ),
        ],
      ),
      action: snackAction,
    );
  }

  ScaffoldFeatureController<SnackBar, SnackBarClosedReason>? info(
    String message, {
    Duration? duration,
    SnackbarAction? action,
  }) => show(message, .info, duration: duration, action: action);

  ScaffoldFeatureController<SnackBar, SnackBarClosedReason>? success(
    String message, {
    Duration? duration,
    SnackbarAction? action,
  }) => show(message, .success, duration: duration, action: action);

  ScaffoldFeatureController<SnackBar, SnackBarClosedReason>? error(
    String message, {
    Duration? duration,
    SnackbarAction? action,
  }) => show(message, .error, duration: duration, action: action);
}

const snackbar = SnackbarManager();
