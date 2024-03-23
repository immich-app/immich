import 'package:flutter/material.dart';

Future<T> showFilterBottomSheet<T>({
  required BuildContext context,
  required Widget child,
}) async {
  return await showModalBottomSheet(
    context: context,
    isScrollControlled: false,
    useSafeArea: false,
    isDismissible: true,
    showDragHandle: true,
    builder: (BuildContext context) {
      return child;
    },
  );
}
