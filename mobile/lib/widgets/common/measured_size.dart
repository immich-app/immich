import 'package:flutter/rendering.dart';
import 'package:flutter/widgets.dart';

/// Invokes [onSizeChanged] after layout whenever the child's laid out size
/// changes (rotation). The callback runs post-frame, so it is safe to update state from it.
class MeasuredSize extends SingleChildRenderObjectWidget {
  final ValueChanged<Size> onSizeChanged;

  const MeasuredSize({super.key, required this.onSizeChanged, super.child});

  @override
  RenderObject createRenderObject(BuildContext context) => _RenderMeasuredSize(onSizeChanged);

  @override
  void updateRenderObject(BuildContext context, RenderObject renderObject) {
    (renderObject as _RenderMeasuredSize).onSizeChanged = onSizeChanged;
  }
}

class _RenderMeasuredSize extends RenderProxyBox {
  _RenderMeasuredSize(this.onSizeChanged);

  ValueChanged<Size> onSizeChanged;
  Size? _reportedSize;

  @override
  void performLayout() {
    super.performLayout();
    if (_reportedSize == size) {
      return;
    }

    _reportedSize = size;
    final measured = size;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (attached && _reportedSize == measured) {
        onSizeChanged(measured);
      }
    });
  }
}
