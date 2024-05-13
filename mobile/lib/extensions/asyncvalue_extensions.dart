import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/widgets/common/immich_loading_indicator.dart';
import 'package:immich_mobile/widgets/common/scaffold_error_body.dart';
import 'package:logging/logging.dart';

extension LogOnError<T> on AsyncValue<T> {
  static final Logger _asyncErrorLogger = Logger("AsyncValue");

  /// Used to return the [ImmichLoadingIndicator] and [ScaffoldErrorBody] widgets by default on loading
  /// and error cases respectively
  Widget widgetWhen({
    bool skipLoadingOnRefresh = true,
    Widget Function()? onLoading,
    Widget Function(Object? error, StackTrace? stack)? onError,
    required Widget Function(T data) onData,
  }) {
    if (isLoading) {
      bool skip = false;
      if (isRefreshing) {
        skip = skipLoadingOnRefresh;
      }

      if (!skip) {
        return onLoading?.call() ??
            const Center(
              child: ImmichLoadingIndicator(),
            );
      }
    }

    if (hasError && !hasValue) {
      _asyncErrorLogger.severe('Could not load value', error, stackTrace);
      return onError?.call(error, stackTrace) ??
          ScaffoldErrorBody(errorMsg: error?.toString());
    }

    return onData(requireValue);
  }
}
