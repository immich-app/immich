import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';

enum ToastType { info, success, error }

class ImmichToast {
  static show({
    required BuildContext context,
    required String msg,
    ToastType toastType = ToastType.info,
    ToastGravity gravity = ToastGravity.TOP,
  }) {
    FToast fToast;

    fToast = FToast();
    fToast.init(context);

    _getColor(ToastType type, BuildContext context) {
      switch (type) {
        case ToastType.info:
          return Theme.of(context).primaryColor;
        case ToastType.success:
          return const Color.fromARGB(255, 78, 140, 124);
        case ToastType.error:
          return const Color.fromARGB(255, 220, 48, 85);
      }
    }

    fToast.showToast(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 12.0),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(5.0),
          color: Colors.grey[50],
          border: Border.all(
            color: Colors.black12,
            width: 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            (toastType == ToastType.info)
                ? Icon(
                    Icons.info_outline_rounded,
                    color: Theme.of(context).primaryColor,
                  )
                : Container(),
            (toastType == ToastType.success)
                ? const Icon(
                    Icons.check_circle_rounded,
                    color: Color.fromARGB(255, 78, 140, 124),
                  )
                : Container(),
            (toastType == ToastType.error)
                ? const Icon(
                    Icons.error_outline_rounded,
                    color: Color.fromARGB(255, 240, 162, 156),
                  )
                : Container(),
            const SizedBox(
              width: 12.0,
            ),
            Flexible(
              child: Text(
                msg,
                style: TextStyle(
                  color: _getColor(toastType, context),
                  fontWeight: FontWeight.bold,
                  fontSize: 15,
                ),
              ),
            ),
          ],
        ),
      ),
      gravity: gravity,
      toastDuration: const Duration(seconds: 2),
    );
  }
}
