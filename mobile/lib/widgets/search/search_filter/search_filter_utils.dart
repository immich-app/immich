import 'package:flutter/material.dart';

Future<T> showFilterBottomSheet<T>({
  required BuildContext context,
  required Widget child,
  bool isScrollControlled = false,
  bool isDismissible = true,
}) async {
  return await showModalBottomSheet(
    context: context,
    isScrollControlled: isScrollControlled,
    useSafeArea: false,
    isDismissible: isDismissible,
    showDragHandle: isDismissible,
    builder: (BuildContext context) {
      return child;
    },
  );
}
