import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/ocr.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/infrastructure/ocr.provider.dart';
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
  int? _selectedBoxIndex;

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
    if (controller == null) return;

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
      if (mounted) setState(() => _controllerValue = value);
    });
  }

  void _detachController() {
    _controllerSub?.cancel();
    _controllerSub = null;
  }

  @override
  Widget build(BuildContext context) {
    if (widget.asset is! RemoteAsset) {
      return const SizedBox.shrink();
    }

    final ocrData = ref.watch(ocrAssetProvider((widget.asset as RemoteAsset).id));

    return ocrData.when(
      data: (data) {
        if (data == null || data.isEmpty) {
          return const SizedBox.shrink();
        }
        return _buildOcrBoxes(data);
      },
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
    );
  }

  Widget _buildOcrBoxes(List<Ocr> ocrData) {
    // Use the actual decoded image size from PhotoView's scaleBoundaries when
    // available. The image provider may serve a downscaled preview (e.g. Immich
    // serves a ~1440px preview for large originals), so the decoded dimensions
    // can differ significantly from the stored asset dimensions. Using the wrong
    // size would scale every coordinate by the ratio between the two resolutions.
    final imageSize = widget.controller?.scaleBoundaries?.childSize ?? widget.imageSize;

    final scale =
        _controllerValue?.scale ??
        math.min(widget.viewportSize.width / imageSize.width, widget.viewportSize.height / imageSize.height);
    final position = _controllerValue?.position ?? Offset.zero;
    return _buildBoxStack(ocrData, imageSize, scale, position);
  }

  Widget _buildBoxStack(List<Ocr> ocrData, Size imageSize, double scale, Offset position) {
    final imageWidth = imageSize.width;
    final imageHeight = imageSize.height;
    final viewportWidth = widget.viewportSize.width;
    final viewportHeight = widget.viewportSize.height;

    // Image center in viewport space, accounting for pan
    final cx = viewportWidth / 2 + position.dx;
    final cy = viewportHeight / 2 + position.dy;

    return GestureDetector(
      behavior: HitTestBehavior.translucent,
      onTap: () {
        setState(() {
          _selectedBoxIndex = null;
        });
      },
      child: ClipRect(
        child: Stack(
          children: [
            // Fills the viewport so taps outside boxes deselect
            SizedBox(width: viewportWidth, height: viewportHeight),
            ...ocrData.asMap().entries.map((entry) {
              final index = entry.key;
              final ocr = entry.value;
              final isSelected = _selectedBoxIndex == index;

              // Map normalized image coords (0–1) to viewport space
              final x1 = cx + (ocr.x1 - 0.5) * imageWidth * scale;
              final y1 = cy + (ocr.y1 - 0.5) * imageHeight * scale;
              final x2 = cx + (ocr.x2 - 0.5) * imageWidth * scale;
              final y2 = cy + (ocr.y2 - 0.5) * imageHeight * scale;
              final x3 = cx + (ocr.x3 - 0.5) * imageWidth * scale;
              final y3 = cy + (ocr.y3 - 0.5) * imageHeight * scale;
              final x4 = cx + (ocr.x4 - 0.5) * imageWidth * scale;
              final y4 = cy + (ocr.y4 - 0.5) * imageHeight * scale;

              // Bounding rectangle for hit testing and Positioned placement
              final minX = [x1, x2, x3, x4].reduce((a, b) => a < b ? a : b);
              final maxX = [x1, x2, x3, x4].reduce((a, b) => a > b ? a : b);
              final minY = [y1, y2, y3, y4].reduce((a, b) => a < b ? a : b);
              final maxY = [y1, y2, y3, y4].reduce((a, b) => a > b ? a : b);

              final angle = math.atan2(y2 - y1, x2 - x1);
              final centerX = (minX + maxX) / 2;
              final centerY = (minY + maxY) / 2;

              return Positioned(
                left: minX,
                top: minY,
                child: GestureDetector(
                  onTap: () {
                    setState(() {
                      _selectedBoxIndex = isSelected ? null : index;
                    });
                  },
                  behavior: HitTestBehavior.translucent,
                  child: SizedBox(
                    width: maxX - minX,
                    height: maxY - minY,
                    child: Stack(
                      children: [
                        CustomPaint(
                          painter: _OcrBoxPainter(
                            points: [
                              Offset(x1 - minX, y1 - minY),
                              Offset(x2 - minX, y2 - minY),
                              Offset(x3 - minX, y3 - minY),
                              Offset(x4 - minX, y4 - minY),
                            ],
                            isSelected: isSelected,
                            colorScheme: context.themeData.colorScheme,
                          ),
                          size: Size(maxX - minX, maxY - minY),
                        ),
                        if (isSelected)
                          Positioned(
                            left: centerX - minX,
                            top: centerY - minY,
                            child: FractionalTranslation(
                              translation: const Offset(-0.5, -0.5),
                              child: Transform.rotate(
                                angle: angle,
                                alignment: Alignment.center,
                                child: Container(
                                  margin: const EdgeInsets.all(2),
                                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: Colors.grey[800]?.withValues(alpha: 0.4),
                                    borderRadius: const BorderRadius.all(Radius.circular(4)),
                                  ),
                                  child: ConstrainedBox(
                                    constraints: BoxConstraints(
                                      maxWidth: math.max(50, maxX - minX),
                                      maxHeight: math.max(20, maxY - minY),
                                    ),
                                    child: FittedBox(
                                      fit: BoxFit.scaleDown,
                                      child: SelectableText(
                                        ocr.text,
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontSize: math.max(12, (maxY - minY) * 0.6),
                                          fontWeight: FontWeight.bold,
                                        ),
                                        textAlign: TextAlign.center,
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              );
            }),
          ],
        ),
      ),
    );
  }
}

class _OcrBoxPainter extends CustomPainter {
  final List<Offset> points;
  final bool isSelected;
  final ColorScheme colorScheme;

  const _OcrBoxPainter({required this.points, required this.isSelected, required this.colorScheme});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = isSelected ? colorScheme.primary : colorScheme.secondary
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;

    final fillPaint = Paint()
      ..color = (isSelected ? colorScheme.primary : colorScheme.secondary).withValues(alpha: 0.1)
      ..style = PaintingStyle.fill;

    final path = Path()
      ..moveTo(points[0].dx, points[0].dy)
      ..lineTo(points[1].dx, points[1].dy)
      ..lineTo(points[2].dx, points[2].dy)
      ..lineTo(points[3].dx, points[3].dy)
      ..close();

    canvas.drawPath(path, fillPaint);
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(_OcrBoxPainter oldDelegate) {
    return oldDelegate.isSelected != isSelected || listEquals(oldDelegate.points, points);
  }
}
