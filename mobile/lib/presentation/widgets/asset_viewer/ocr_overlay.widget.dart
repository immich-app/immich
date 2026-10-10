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

class OcrOverlay extends ConsumerWidget {
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
  Widget build(BuildContext context, WidgetRef ref) {
    final asset = this.asset;
    if (asset is! RemoteAsset) {
      return const SizedBox.shrink();
    }

    final ocrData = ref.watch(Store.ocr.forAsset(asset.id)).valueOrNull;
    if (ocrData == null || ocrData.isEmpty) {
      return const SizedBox.shrink();
    }

    return OcrSelectionLayer(
      key: ValueKey(asset.id),
      ocrData: ocrData,
      imageSize: imageSize,
      viewportSize: viewportSize,
      controller: controller,
      onSelectionStart: () => ref.read(hapticFeedbackProvider.notifier).selectionClick(),
    );
  }
}

/// Lays an invisible, selectable line of text over every recognized text box,
/// so the text can be selected directly on the image.
@visibleForTesting
class OcrSelectionLayer extends StatefulWidget {
  final List<Ocr> ocrData;
  final Size imageSize;
  final Size viewportSize;
  final PhotoViewControllerBase? controller;
  final VoidCallback? onSelectionStart;

  const OcrSelectionLayer({
    super.key,
    required this.ocrData,
    required this.imageSize,
    required this.viewportSize,
    this.controller,
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

  // Zoom and pan of the photo, null until the controller reports a reliable value.
  final _controllerValue = ValueNotifier<PhotoViewControllerValue?>(null);
  StreamSubscription<PhotoViewControllerValue>? _controllerSub;

  late Size _imageSize = _resolveImageSize();

  List<Ocr>? _linesData;
  Size? _linesSize;
  Path _textArea = Path();
  Path _scrim = Path();
  Widget _lines = const SizedBox.shrink();

  @override
  void initState() {
    super.initState();
    _attachController(widget.controller);
  }

  @override
  void didUpdateWidget(OcrSelectionLayer oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.controller != widget.controller) {
      _detachController();
      _attachController(widget.controller);
    }
    _imageSize = _resolveImageSize();
  }

  @override
  void dispose() {
    _detachController();
    _controllerValue.dispose();
    _longPressRecognizer.dispose();
    _tapRecognizer.dispose();
    _selectionDelegate.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  // The decoded image may be a downscaled preview, so prefer its size over the asset's.
  Size _resolveImageSize() => widget.controller?.scaleBoundaries?.childSize ?? widget.imageSize;

  void _attachController(PhotoViewControllerBase? controller) {
    _controllerValue.value = null;
    if (controller == null) {
      return;
    }

    if (controller.scaleBoundaries != null) {
      _controllerValue.value = controller.value;
    }

    _controllerSub = controller.outputStateStream.listen((value) {
      if (!mounted) {
        return;
      }
      _controllerValue.value = value;
      final imageSize = _resolveImageSize();
      if (imageSize != _imageSize) {
        setState(() => _imageSize = imageSize);
      }
    });
  }

  void _detachController() {
    unawaited(_controllerSub?.cancel());
    _controllerSub = null;
  }

  bool get _hasSelection => _selectionDelegate.value.hasSelection;

  bool _isOnText(Offset viewportPosition) {
    final viewportToImage = Matrix4.tryInvert(_imageToViewport(_controllerValue.value));
    if (viewportToImage == null) {
      return false;
    }
    return _textArea.contains(MatrixUtils.transformPoint(viewportToImage, viewportPosition));
  }

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

  void _layoutLines() {
    if (identical(_linesData, widget.ocrData) && _linesSize == _imageSize) {
      return;
    }
    _linesData = widget.ocrData;
    _linesSize = _imageSize;

    final textArea = Path();
    final lines = <Widget>[];
    for (final ocr in widget.ocrData) {
      // Map normalized image coords (0–1) to image space
      final p1 = Offset(ocr.x1 * _imageSize.width, ocr.y1 * _imageSize.height);
      final p2 = Offset(ocr.x2 * _imageSize.width, ocr.y2 * _imageSize.height);
      final p3 = Offset(ocr.x3 * _imageSize.width, ocr.y3 * _imageSize.height);
      final p4 = Offset(ocr.x4 * _imageSize.width, ocr.y4 * _imageSize.height);
      final width = (p2 - p1).distance;
      final height = (p4 - p1).distance;
      if (width <= 0 || height <= 0 || ocr.text.isEmpty) {
        continue;
      }

      textArea.addPolygon([p1, p2, p3, p4], true);
      lines.add(
        Positioned(
          key: ValueKey(ocr.id),
          left: p1.dx,
          top: p1.dy,
          width: width,
          height: height,
          child: Transform.rotate(
            angle: (p2 - p1).direction,
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

    _textArea = textArea;
    // Dim the image, with the text boxes punched out by the even-odd rule
    _scrim = Path.from(textArea)
      ..fillType = PathFillType.evenOdd
      ..addRect(Offset.zero & _imageSize);
    _lines = Stack(clipBehavior: Clip.none, children: lines);
  }

  Matrix4 _imageToViewport(PhotoViewControllerValue? value) {
    final viewport = widget.viewportSize;
    final scale = value?.scale ?? math.min(viewport.width / _imageSize.width, viewport.height / _imageSize.height);
    final position = value?.position ?? Offset.zero;

    // Image center in viewport space, accounting for pan
    final cx = viewport.width / 2 + position.dx;
    final cy = viewport.height / 2 + position.dy;

    return Matrix4.identity()
      ..translateByDouble(cx - _imageSize.width * scale / 2, cy - _imageSize.height * scale / 2, 0, 1.0)
      ..scaleByDouble(scale, scale, 1.0, 1.0);
  }

  @override
  Widget build(BuildContext context) {
    if (_imageSize.isEmpty) {
      return const SizedBox.shrink();
    }
    _layoutLines();

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
              child: OverflowBox(
                alignment: Alignment.topLeft,
                minWidth: _imageSize.width,
                maxWidth: _imageSize.width,
                minHeight: _imageSize.height,
                maxHeight: _imageSize.height,
                child: ValueListenableBuilder(
                  valueListenable: _controllerValue,
                  child: _lines,
                  builder: (context, value, lines) {
                    final transform = _imageToViewport(value);
                    return Transform(
                      transform: transform,
                      child: CustomPaint(
                        painter: _OcrBoxesPainter(scrim: _scrim, boxes: _textArea, scale: transform.storage[0]),
                        child: lines,
                      ),
                    );
                  },
                ),
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
  final Path scrim;
  final Path boxes;
  final double scale;

  const _OcrBoxesPainter({required this.scrim, required this.boxes, required this.scale});

  @override
  void paint(Canvas canvas, Size size) {
    canvas.drawPath(scrim, Paint()..color = Colors.black54);
    canvas.drawPath(
      boxes,
      Paint()
        ..color = Colors.white.withValues(alpha: 0.8)
        ..style = PaintingStyle.stroke
        ..strokeWidth = scale > 0 ? 1.5 / scale : 1.5,
    );
  }

  @override
  bool shouldRepaint(_OcrBoxesPainter oldDelegate) =>
      oldDelegate.scale != scale || !identical(oldDelegate.scrim, scrim) || !identical(oldDelegate.boxes, boxes);
}
