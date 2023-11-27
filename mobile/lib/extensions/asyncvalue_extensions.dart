import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/ui/immich_loading_indicator.dart';
import 'package:immich_mobile/shared/ui/scaffold_error_body.dart';
import 'package:logging/logging.dart';

extension LogOnError<T> on AsyncValue<T> {
  static final Logger _asyncErrorLogger = Logger("AsyncValue");

  Widget widgetWhen({
    Widget Function()? onLoading,
    required Widget Function(T data) onData,
    Widget Function(Object? error, StackTrace? stack)? onError,
  }) {
    if (isLoading) {
      return onLoading?.call() ??
          const Center(
            child: ImmichLoadingIndicator(),
          );
    }

    if (hasError && !hasValue) {
      _asyncErrorLogger.severe("Error occured", error, stackTrace);
      return onError?.call(error, stackTrace) ?? const ScaffoldErrorBody();
    }

    return onData(requireValue);
  }
}
