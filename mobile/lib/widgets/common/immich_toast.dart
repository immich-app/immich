import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';

enum ToastType { info, success, error }

class ImmichToast {
  static show({
    required BuildContext context,
    required String msg,
    ToastType toastType = ToastType.info,
    ToastGravity gravity = ToastGravity.BOTTOM,
    int durationInSecond = 3,
  }) {
    final fToast = FToast();
    fToast.init(context);

    Color getColor(ToastType type, BuildContext context) => switch (type) {
          ToastType.info => context.primaryColor,
          ToastType.success => const Color.fromARGB(255, 78, 140, 124),
          ToastType.error => const Color.fromARGB(255, 220, 48, 85),
        };

    Icon getIcon(ToastType type) => switch (type) {
          ToastType.info => Icon(
              Icons.info_outline_rounded,
              color: context.primaryColor,
            ),
          ToastType.success => const Icon(
              Icons.check_circle_rounded,
              color: Color.fromARGB(255, 78, 140, 124),
            ),
          ToastType.error => const Icon(
              Icons.error_outline_rounded,
              color: Color.fromARGB(255, 240, 162, 156),
            ),
        };

    fToast.showToast(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 12.0),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(5.0),
          color: context.colorScheme.surfaceContainer,
          border: Border.all(
            color: context.colorScheme.outline.withValues(alpha: .5),
            width: 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            getIcon(toastType),
            const SizedBox(
              width: 12.0,
            ),
            Flexible(
              child: Text(
                msg,
                style: TextStyle(
                  color: getColor(toastType, context),
                  fontWeight: FontWeight.bold,
                  fontSize: 15,
                ),
              ),
            ),
          ],
        ),
      ),
      gravity: gravity,
      toastDuration: Duration(seconds: durationInSecond),
    );
  }
}
