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

    Color getColor(ToastType type, BuildContext context) {
      switch (type) {
        case ToastType.info:
          return const Color.fromARGB(255, 48, 111, 220);
        case ToastType.success:
          return const Color.fromARGB(255, 78, 140, 124);
        case ToastType.error:
          return const Color.fromARGB(255, 220, 48, 85);
      }
    }

    IconData getIcon(ToastType type) {
      switch (type) {
        case ToastType.info:
          return Icons.info_outline_rounded;
        case ToastType.success:
          return Icons.check_circle_outline_rounded;
        case ToastType.error:
          return Icons.report_problem_outlined;
      }
    }

    fToast.showToast(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12.0),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(5.0),
          color: context.colorScheme.inverseSurface,
          border: Border.all(
            color: context.colorScheme.inverseSurface,
            width: 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.max,
          mainAxisAlignment: MainAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.only(left: 15, right: 5),
              child: Icon(
                getIcon(toastType),
                color: getColor(toastType, context),
              ),
            ),
            const SizedBox(
              width: 12.0,
            ),
            Flexible(
              child: Text(
                msg,
                style: TextStyle(
                  color: context.colorScheme.onInverseSurface,
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
