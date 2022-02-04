import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';

enum ToastType { info, success, error }

class ImmichToast {
  static show({
    required BuildContext context,
    required String msg,
    ToastType toastType = ToastType.info,
  }) {
    FToast fToast;

    fToast = FToast();
    fToast.init(context);

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
                    Icons.check,
                    color: Color.fromARGB(255, 104, 248, 140),
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
                  color: Theme.of(context).primaryColor,
                  fontWeight: FontWeight.bold,
                  fontSize: 15,
                ),
              ),
            ),
          ],
        ),
      ),
      gravity: ToastGravity.TOP,
      toastDuration: const Duration(seconds: 2),
    );
  }
}
