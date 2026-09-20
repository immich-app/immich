import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/gestures.dart';
import 'package:flutter/widgets.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';

/// Mapping of pinch to zoom on the timeline grid to the number of columns displayed. Directly drives the `timelineTilesPerRow` setting
class TimelinePinchZoom extends ConsumerStatefulWidget {
  const TimelinePinchZoom({super.key, required this.onColumnCountWillChange, required this.child});

  /// Callback when a column count change is expected
  ///
  /// This is called immediately before the new count is written to the setting, while the gesture is still actively resolving
  final VoidCallback onColumnCountWillChange;

  final Widget child;

  @override
  ConsumerState createState() => _TimelinePinchZoomState();
}

class _TimelinePinchZoomState extends ConsumerState<TimelinePinchZoom> {
  int _perRow = 4;
  double _scaleFactor = 3.0;
  double _baseScaleFactor = 3.0;

  @override
  void initState() {
    super.initState();

    _perRow = ref.read(appConfigProvider.select((config) => config.timeline.tilesPerRow));
    _scaleFactor = 7.0 - _perRow;
    _baseScaleFactor = _scaleFactor;
  }

  @override
  Widget build(BuildContext context) {
    return RawGestureDetector(
      gestures: {
        _CustomScaleGestureRecognizer: GestureRecognizerFactoryWithHandlers<_CustomScaleGestureRecognizer>(
          () => _CustomScaleGestureRecognizer(),
          (_CustomScaleGestureRecognizer scale) {
            scale.onStart = (details) {
              _baseScaleFactor = _scaleFactor;
            };

            scale.onUpdate = (details) {
              final newScaleFactor = math.max(math.min(5.0, _baseScaleFactor * details.scale), 1.0);
              final newPerRow = 7 - newScaleFactor.toInt();

              if (newPerRow != _perRow) {
                widget.onColumnCountWillChange();
                setState(() {
                  _scaleFactor = newScaleFactor;
                  _perRow = newPerRow;
                });

                unawaited(ref.read(settingsProvider).write(.timelineTilesPerRow, _perRow));
              }
            };
          },
        ),
      },
      child: widget.child,
    );
  }
}

/// accepts a gesture even though it should reject it (because child won)
class _CustomScaleGestureRecognizer extends ScaleGestureRecognizer {
  @override
  void rejectGesture(int pointer) {
    acceptGesture(pointer);
  }
}
