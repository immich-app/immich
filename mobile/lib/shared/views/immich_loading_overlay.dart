import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/shared/ui/immich_loading_indicator.dart';

final _loadingEntry = OverlayEntry(
  builder: (context) => SizedBox.square(
    dimension: double.infinity,
    child: DecoratedBox(
      decoration:
          BoxDecoration(color: context.colorScheme.surface.withAlpha(200)),
      child: const Center(child: ImmichLoadingIndicator()),
    ),
  ),
);

ValueNotifier<bool> useProcessingOverlay() {
  return use(const _LoadingOverlay());
}

class _LoadingOverlay extends Hook<ValueNotifier<bool>> {
  const _LoadingOverlay();

  @override
  _LoadingOverlayState createState() => _LoadingOverlayState();
}

class _LoadingOverlayState
    extends HookState<ValueNotifier<bool>, _LoadingOverlay> {
  late final _isProcessing = ValueNotifier(false)..addListener(_listener);
  OverlayEntry? overlayEntry;

  void _listener() {
    setState(() {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_isProcessing.value) {
          overlayEntry?.remove();
          overlayEntry = _loadingEntry;
          Overlay.of(context).insert(_loadingEntry);
        } else {
          overlayEntry?.remove();
          overlayEntry = null;
        }
      });
    });
  }

  @override
  ValueNotifier<bool> build(BuildContext context) {
    return _isProcessing;
  }

  @override
  void dispose() {
    _isProcessing.dispose();
    super.dispose();
  }

  @override
  Object? get debugValue => _isProcessing.value;

  @override
  String get debugLabel => 'useProcessingOverlay<>';
}
