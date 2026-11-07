import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/data/store.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/ocr.model.dart';
import 'package:immich_mobile/providers/haptic_feedback.provider.dart';
import 'package:immich_mobile/widgets/photo_view/photo_view.dart';

class OcrOverlay extends ConsumerStatefulWidget {
  final BaseAsset asset;
  final Size imageSize;
  final Size viewportSize;
  final PhotoViewControllerBase? controller;

  const OcrOverlay({
    super.key,
    required this.asset,
    required this.imageSize,
    required this.viewportSize,
    this.controller,
  });

  @override
  ConsumerState<OcrOverlay> createState() => _OcrOverlayState();
}

class _OcrOverlayState extends ConsumerState<OcrOverlay> {
  // Current transform read from the PhotoView controller.
  // Null until the controller has emitted at least one real event or until
  // we can seed a reliable value from controller.value on init.
  PhotoViewControllerValue? _controllerValue;
  StreamSubscription<PhotoViewControllerValue>? _controllerSub;

  @override
  void initState() {
    super.initState();
    _attachController(widget.controller);
  }

  @override
  void didUpdateWidget(OcrOverlay oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.controller != widget.controller) {
      _detachController();
      _attachController(widget.controller);
    }
  }

  @override
  void dispose() {
    _detachController();
    super.dispose();
  }

  void _attachController(PhotoViewControllerBase? controller) {
    if (controller == null) {
      return;
    }

    // Seed with the current value only when scaleBoundaries is already set.
    // Before the image finishes loading, PhotoView uses childSize = outerSize
    // (viewport) as a placeholder, which sets scale = 1.0.  That placeholder
    // is wrong for any image that doesn't exactly fill the viewport.
    // Once scaleBoundaries is set the value is trustworthy (the image has rendered
    // at least one frame and setScaleInvisibly has been called with the real
    // initial/zoomed scale).
    if (controller.scaleBoundaries != null) {
      _controllerValue = controller.value;
    }

    _controllerSub = controller.outputStateStream.listen((value) {
      if (mounted) {
        setState(() => _controllerValue = value);
      }
    });
  }

  void _detachController() {
    unawaited(_controllerSub?.cancel());
    _controllerSub = null;
  }

  @override
  Widget build(BuildContext context) {
    final asset = widget.asset;
    if (asset is! RemoteAsset) {
      return const SizedBox.shrink();
    }

    final ocrData = ref.watch(Store.ocr.forAsset(asset.id));

    return ocrData.when(
      data: (data) {
        if (data.isEmpty) {
          return const SizedBox.shrink();
        }
        return OcrSelectionLayer(
          key: ValueKey(asset.id),
          ocrData: data,
          controller: widget.controller,
          imageSize: widget.imageSize,
          viewportSize: widget.viewportSize,
          controllerValue: _controllerValue,
          onSelectionStart: () => ref.read(hapticFeedbackProvider.notifier).selectionClick(),
        );
      },
      loading: () => const SizedBox.shrink(),
      error: (_, _) => const SizedBox.shrink(),
    );
  }
}

/// Lays an invisible, selectable line of text over every recognized text box,
/// so the text can be selected directly on the image.
@visibleForTesting
class OcrSelectionLayer extends StatefulWidget {
  final List<Ocr> ocrData;
  final PhotoViewControllerBase? controller;
  final Size imageSize;
  final Size viewportSize;
  final PhotoViewControllerValue? controllerValue;
  final VoidCallback? onSelectionStart;

  const OcrSelectionLayer({
    super.key,
    required this.ocrData,
    required this.imageSize,
    required this.viewportSize,
    this.controller,
    this.controllerValue,
    this.onSelectionStart,
  });

  @override
  State<OcrSelectionLayer> createState() => _OcrSelectionLayerState();
}

class _OcrSelectionLayerState extends State<OcrSelectionLayer> {
  final _selectionAreaKey = GlobalKey<SelectionAreaState>();
  final _selectionDelegate = _OcrSelectionDelegate();
  final _focusNode = FocusNode(debugLabel: 'OcrSelectionLayer');

  // We handle gestures ourself so that we don't steal the gestures from the PhotoView.
  late final _longPressRecognizer = LongPressGestureRecognizer(debugOwner: this)
    ..onLongPressStart = _onLongPressStart
    ..onLongPressMoveUpdate = _onLongPressMoveUpdate;
  late final _tapRecognizer = TapGestureRecognizer(debugOwner: this)..onTap = _clearSelection;

  List<List<Offset>> _quads = const [];

  @override
  void dispose() {
    _longPressRecognizer.dispose();
    _tapRecognizer.dispose();
    _selectionDelegate.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  bool get _hasSelection => _selectionDelegate.value.hasSelection;

  bool _isOnText(Offset position) => _quads.any((quad) => (Path()..addPolygon(quad, true)).contains(position));

  void _onPointerDown(PointerDownEvent event) {
    if (_hasSelection) {
      _tapRecognizer.addPointer(event);
    }
    if (_isOnText(event.localPosition)) {
      _longPressRecognizer.addPointer(event);
    }
  }

  void _onLongPressStart(LongPressStartDetails details) {
    final selectableRegion = _selectionAreaKey.currentState?.selectableRegion;
    if (selectableRegion == null) {
      return;
    }
    widget.onSelectionStart?.call();
    _focusNode.requestFocus();
    _selectionDelegate.selectWordAt(selectableRegion, details.globalPosition);
  }

  void _onLongPressMoveUpdate(LongPressMoveUpdateDetails details) {
    if (!_hasSelection) {
      return;
    }
    _selectionDelegate.dispatchSelectionEvent(
      SelectionEdgeUpdateEvent.forEnd(globalPosition: details.globalPosition, granularity: TextGranularity.word),
    );
  }

  void _clearSelection() => _selectionAreaKey.currentState?.selectableRegion.clearSelection();

  @override
  Widget build(BuildContext context) {
    // Use the actual decoded image size from PhotoView's scaleBoundaries when
    // available. The image provider may serve a downscaled preview (e.g. Immich
    // serves a ~1440px preview for large originals), so the decoded dimensions
    // can differ significantly from the stored asset dimensions. Using the wrong
    // size would scale every coordinate by the ratio between the two resolutions.
    final resolvedImageSize = widget.controller?.scaleBoundaries?.childSize ?? widget.imageSize;
    final viewportSize = widget.viewportSize;

    final scale =
        widget.controllerValue?.scale ??
        math.min(viewportSize.width / resolvedImageSize.width, viewportSize.height / resolvedImageSize.height);
    final position = widget.controllerValue?.position ?? Offset.zero;

    final imageWidth = resolvedImageSize.width;
    final imageHeight = resolvedImageSize.height;
    final viewportWidth = viewportSize.width;
    final viewportHeight = viewportSize.height;

    // Image center in viewport space, accounting for pan
    final cx = viewportWidth / 2 + position.dx;
    final cy = viewportHeight / 2 + position.dy;

    final quads = <List<Offset>>[];
    final lines = <Widget>[];

    for (final ocr in widget.ocrData) {
      // Map normalized image coords (0–1) to viewport space
      final x1 = cx + (ocr.x1 - 0.5) * imageWidth * scale;
      final y1 = cy + (ocr.y1 - 0.5) * imageHeight * scale;
      final x2 = cx + (ocr.x2 - 0.5) * imageWidth * scale;
      final y2 = cy + (ocr.y2 - 0.5) * imageHeight * scale;
      final x3 = cx + (ocr.x3 - 0.5) * imageWidth * scale;
      final y3 = cy + (ocr.y3 - 0.5) * imageHeight * scale;
      final x4 = cx + (ocr.x4 - 0.5) * imageWidth * scale;
      final y4 = cy + (ocr.y4 - 0.5) * imageHeight * scale;

      final width = Offset(x2 - x1, y2 - y1).distance;
      final height = Offset(x4 - x1, y4 - y1).distance;
      if (width <= 0 || height <= 0 || ocr.text.isEmpty) {
        continue;
      }

      quads.add([Offset(x1, y1), Offset(x2, y2), Offset(x3, y3), Offset(x4, y4)]);

      lines.add(
        Positioned(
          key: ValueKey(ocr.id),
          left: x1,
          top: y1,
          width: width,
          height: height,
          child: Transform.rotate(
            angle: math.atan2(y2 - y1, x2 - x1),
            alignment: Alignment.topLeft,
            child: FittedBox(
              fit: BoxFit.fill,
              child: Text(
                ocr.text.replaceAll('\n', ' '),
                maxLines: 1,
                softWrap: false,
                textScaler: TextScaler.noScaling,
                style: const TextStyle(color: Colors.transparent, fontSize: 16, height: 1.0),
              ),
            ),
          ),
        ),
      );
    }

    _quads = quads;

    return ClipRect(
      // Translucent + ignored child: receive pointers
      // but don't block the gestures of the viewer
      child: Listener(
        behavior: HitTestBehavior.translucent,
        onPointerDown: _onPointerDown,
        child: IgnorePointer(
          child: SelectionArea(
            key: _selectionAreaKey,
            focusNode: _focusNode,
            child: SelectionContainer(
              delegate: _selectionDelegate,
              // Dark scrim with the text boxes punched out
              child: CustomPaint(
                painter: _OcrBoxesPainter(quads: quads),
                child: Stack(children: lines),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _OcrSelectionDelegate extends StaticSelectionContainerDelegate {
  Offset? _wordPosition;

  /// Selects the word at [globalPosition] and shows the handles and toolbar.
  void selectWordAt(SelectableRegionState region, Offset globalPosition) {
    _wordPosition = globalPosition;
    region.selectAll(SelectionChangedCause.toolbar);
    _wordPosition = null;
  }

  @override
  SelectionResult handleSelectAll(SelectAllSelectionEvent event) {
    final position = _wordPosition;
    if (position == null) {
      return super.handleSelectAll(event);
    }
    return handleSelectWord(SelectWordSelectionEvent(globalPosition: position));
  }

  @override
  SelectedContent? getSelectedContent() {
    final lines = [
      for (final selectable in selectables)
        if (selectable.getSelectedContent() case final SelectedContent content) content.plainText,
    ];
    if (lines.isEmpty) {
      return null;
    }
    return SelectedContent(plainText: lines.join('\n'));
  }
}

class _OcrBoxesPainter extends CustomPainter {
  final List<List<Offset>> quads;

  const _OcrBoxesPainter({required this.quads});

  @override
  void paint(Canvas canvas, Size size) {
    // Fill the whole viewport, then subtract each text quad using the even-odd
    // rule so the original image shows through the boxes.
    final scrim = Path()
      ..fillType = PathFillType.evenOdd
      ..addRect(Offset.zero & size);
    final boxes = Path();

    for (final quad in quads) {
      scrim.addPolygon(quad, true);
      boxes.addPolygon(quad, true);
    }

    canvas.drawPath(scrim, Paint()..color = Colors.black54);
    canvas.drawPath(
      boxes,
      Paint()
        ..color = Colors.white.withValues(alpha: 0.8)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.5,
    );
  }

  @override
  bool shouldRepaint(_OcrBoxesPainter oldDelegate) => true;
}
