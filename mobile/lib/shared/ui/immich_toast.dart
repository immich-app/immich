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
          return context.primaryColor;
        case ToastType.success:
          return const Color.fromARGB(255, 78, 140, 124);
        case ToastType.error:
          return const Color.fromARGB(255, 220, 48, 85);
      }
    }

    Icon getIcon(ToastType type) {
      switch (type) {
        case ToastType.info:
          return Icon(
            Icons.info_outline_rounded,
            color: context.primaryColor,
          );
        case ToastType.success:
          return const Icon(
            Icons.check_circle_rounded,
            color: Color.fromARGB(255, 78, 140, 124),
          );
        case ToastType.error:
          return const Icon(
            Icons.error_outline_rounded,
            color: Color.fromARGB(255, 240, 162, 156),
          );
      }
    }

    fToast.showToast(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 12.0),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(5.0),
          color: context.isDarkTheme ? Colors.grey[900] : Colors.grey[50],
          border: Border.all(
            color: Colors.black12,
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
