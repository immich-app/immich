import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';

/// Creates a [DraggableScrollableController] that will be disposed automatically.
///
/// See also:
/// - [DraggableScrollableController]
DraggableScrollableController useDraggableScrollController({
  List<Object?>? keys,
}) {
  return use(
    _DraggableScrollControllerHook(
      keys: keys,
    ),
  );
}

class _DraggableScrollControllerHook
    extends Hook<DraggableScrollableController> {
  const _DraggableScrollControllerHook({
    List<Object?>? keys,
  }) : super(keys: keys);

  @override
  HookState<DraggableScrollableController, Hook<DraggableScrollableController>>
      createState() => _DraggableScrollControllerHookState();
}

class _DraggableScrollControllerHookState extends HookState<
    DraggableScrollableController, _DraggableScrollControllerHook> {
  late final controller = DraggableScrollableController();

  @override
  DraggableScrollableController build(BuildContext context) => controller;

  @override
  void dispose() => controller.dispose();

  @override
  String get debugLabel => 'useDraggableScrollController';
}
