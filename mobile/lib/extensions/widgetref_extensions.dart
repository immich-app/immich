import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/providers/immich_loading_overlay.provider.dart';

extension LoadingOverlay on WidgetRef {
  ValueNotifier<bool> useProcessingOverlay() {
    final result = useState(false);
    final immichOverlayController =
        read(immichLoadingOverlayController.notifier);
    useValueChanged(
      result.value,
      (_, __) => result.value
          ? WidgetsBinding.instance
              .addPostFrameCallback((_) => immichOverlayController.show())
          : WidgetsBinding.instance
              .addPostFrameCallback((_) => immichOverlayController.hide()),
    );
    return result;
  }
}
