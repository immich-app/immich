import 'package:flutter/material.dart';

Future<T> showFilterBottomSheet<T>({
  required BuildContext context,
  required Widget child,
  bool isScrollControlled = false,
}) async {
  return await showModalBottomSheet(
    context: context,
    isScrollControlled: isScrollControlled,
    useSafeArea: false,
    isDismissible: true,
    showDragHandle: true,
    builder: (BuildContext context) {
      return child;
    },
  );
}
