import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/ui/immich_loading_indicator.dart';
import 'package:immich_mobile/shared/ui/scaffold_error_body.dart';
import 'package:logging/logging.dart';

extension ScaffoldBody<T> on AsyncValue<T> {
  static final Logger _scaffoldBodyLog = Logger("ScaffoldBody");

  Widget scaffoldBodyWhen({
    required Widget Function(T data) onData,
    Widget? onError,
  }) {
    if (isLoading) {
      return const Center(
        child: ImmichLoadingIndicator(),
      );
    }

    if (hasError && !hasValue) {
      _scaffoldBodyLog.severe("Error occured in AsyncValue", error, stackTrace);
      return onError ?? const ScaffoldErrorBody();
    }

    return onData(requireValue);
  }
}
