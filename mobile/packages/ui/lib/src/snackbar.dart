import 'package:flutter/material.dart';
import 'package:immich_ui/immich_ui.dart';

final scaffoldMessengerKey = GlobalKey<ScaffoldMessengerState>();

class SnackbarManager {
  const SnackbarManager();

  ScaffoldFeatureController<SnackBar, SnackBarClosedReason>? show(String message, SnackbarType type) {
    final messenger = scaffoldMessengerKey.currentState;
    final context = scaffoldMessengerKey.currentContext;
    if (messenger == null || context == null) {
      return null;
    }

    messenger.hideCurrentSnackBar();
    return messenger.showSnackBar(_build(context, message, type));
  }

  SnackBar _build(BuildContext context, String message, SnackbarType type) {
    final theme = Theme.of(context);
    final colors = theme.extension<ImmichColors>() ?? ImmichColors.harmonized(theme.colorScheme);
    final (IconData icon, Color background, Color foreground) = switch (type) {
      .info => (Icons.info_rounded, colors.info, colors.onInfo),
      .success => (Icons.check_circle_rounded, colors.success, colors.onSuccess),
      .error => (Icons.warning_rounded, colors.error, colors.onError),
    };

    return SnackBar(
      behavior: .floating,
      backgroundColor: background,
      duration: const .new(seconds: 4),
      shape: const RoundedRectangleBorder(borderRadius: .all(.circular(ImmichRadius.sm))),
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
    );
  }

  ScaffoldFeatureController<SnackBar, SnackBarClosedReason>? info(String message) => show(message, .info);

  ScaffoldFeatureController<SnackBar, SnackBarClosedReason>? success(String message) => show(message, .success);

  ScaffoldFeatureController<SnackBar, SnackBarClosedReason>? error(String message) => show(message, .error);
}

const snackbar = SnackbarManager();
