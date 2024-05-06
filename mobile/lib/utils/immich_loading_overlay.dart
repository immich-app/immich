import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/widgets/common/delayed_loading_indicator.dart';

final _loadingEntry = OverlayEntry(
  builder: (context) => SizedBox.square(
    dimension: double.infinity,
    child: DecoratedBox(
      decoration:
          BoxDecoration(color: context.colorScheme.surface.withAlpha(200)),
      child: const Center(
        child: DelayedLoadingIndicator(
          delay: Duration(seconds: 1),
          fadeInDuration: Duration(milliseconds: 400),
        ),
      ),
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
  late final _isLoading = ValueNotifier(false)..addListener(_listener);
  OverlayEntry? _loadingOverlay;

  void _listener() {
    setState(() {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_isLoading.value) {
          _loadingOverlay?.remove();
          _loadingOverlay = _loadingEntry;
          Overlay.of(context).insert(_loadingEntry);
        } else {
          _loadingOverlay?.remove();
          _loadingOverlay = null;
        }
      });
    });
  }

  @override
  ValueNotifier<bool> build(BuildContext context) {
    return _isLoading;
  }

  @override
  void dispose() {
    _isLoading.dispose();
    super.dispose();
  }

  @override
  Object? get debugValue => _isLoading.value;

  @override
  String get debugLabel => 'useProcessingOverlay<>';
}
