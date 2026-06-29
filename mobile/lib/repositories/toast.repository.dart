import 'dart:async';

import 'package:immich_ui/immich_ui.dart';

class ToastOption {
  final Duration? timeout;
  final FutureOr<void> Function()? onUndo;

  const ToastOption({this.timeout, this.onUndo});
}

class ToastRepository {
  const ToastRepository();

  FutureOr<void> success(String message, {ToastOption? toast}) {
    snackbar.success(message, duration: toast?.timeout);
  }

  FutureOr<void> info(String message, {ToastOption? toast}) {
    snackbar.info(message, duration: toast?.timeout);
  }

  FutureOr<void> error(String message, {ToastOption? toast}) {
    snackbar.error(message, duration: toast?.timeout);
  }
}
