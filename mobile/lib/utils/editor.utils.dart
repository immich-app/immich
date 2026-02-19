import 'dart:async';
import 'dart:math';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/asset_edit.model.dart';
import 'package:immich_mobile/utils/matrix.utils.dart';
import 'package:openapi/api.dart' hide AssetEditAction;

Rect convertCropParametersToRect(CropParameters parameters, int originalWidth, int originalHeight) {
  return Rect.fromLTWH(
    parameters.x.toDouble() / originalWidth,
    parameters.y.toDouble() / originalHeight,
    parameters.width.toDouble() / originalWidth,
    parameters.height.toDouble() / originalHeight,
  );
}

CropParameters convertRectToCropParameters(Rect rect, int originalWidth, int originalHeight) {
  final x = (rect.left * originalWidth).round();
  final y = (rect.top * originalHeight).round();
  final width = (rect.width * originalWidth).round();
  final height = (rect.height * originalHeight).round();

  return CropParameters(
    x: max(x, 0).clamp(0, originalWidth),
    y: max(y, 0).clamp(0, originalHeight),
    width: max(width, 0).clamp(0, originalWidth - x),
    height: max(height, 0).clamp(0, originalHeight - y),
  );
}

AffineMatrix buildAffineFromEdits(List<AssetEdit> edits) {
  return AffineMatrix.compose(
    edits.map<AffineMatrix>((edit) {
      switch (edit.action) {
        case AssetEditAction.rotate:
          final angleInDegrees = edit.parameters["angle"] as num;
          final angleInRadians = angleInDegrees * pi / 180;
          return AffineMatrix.rotate(angleInRadians);
        case AssetEditAction.mirror:
          final axis = edit.parameters["axis"] as String;
          return axis == "horizontal" ? AffineMatrix.flipY() : AffineMatrix.flipX();
        default:
          return AffineMatrix.identity();
      }
    }).toList(),
  );
}

bool isCloseToZero(double value, [double epsilon = 1e-15]) {
  return value.abs() < epsilon;
}

typedef NormalizedTransform = ({double rotation, bool mirrorHorizontal, bool mirrorVertical});

NormalizedTransform normalizeTransformEdits(List<AssetEdit> edits) {
  final matrix = buildAffineFromEdits(edits);

  double a = matrix.a;
  double b = matrix.b;
  double c = matrix.c;
  double d = matrix.d;

  final rotation = ((isCloseToZero(a) ? asin(c) : acos(a)) * 180) / pi;

  return (
    rotation: rotation < 0 ? 360 + rotation : rotation,
    mirrorHorizontal: false,
    mirrorVertical: isCloseToZero(a) ? b == c : a == -d,
  );
}

class MatrixAdjustmentPainter extends CustomPainter {
  final ui.Image image;
  final ColorFilter? filter;

  const MatrixAdjustmentPainter({required this.image, this.filter});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..colorFilter = filter;

    final srcRect = Rect.fromLTWH(0, 0, image.width.toDouble(), image.height.toDouble());
    final dstRect = Rect.fromLTWH(0, 0, size.width, size.height);

    canvas.drawImageRect(image, srcRect, dstRect, paint);
  }

  @override
  bool shouldRepaint(covariant MatrixAdjustmentPainter oldDelegate) {
    return oldDelegate.image != image || oldDelegate.filter != filter;
  }
}

/// Helper to resolve an ImageProvider to a ui.Image
Future<ui.Image> resolveImage(ImageProvider provider) {
  final completer = Completer<ui.Image>();
  final stream = provider.resolve(const ImageConfiguration());

  late final ImageStreamListener listener;
  listener = ImageStreamListener(
    (ImageInfo info, bool sync) {
      if (!completer.isCompleted) {
        completer.complete(info.image);
      }
      stream.removeListener(listener);
    },
    onError: (error, stackTrace) {
      if (!completer.isCompleted) {
        completer.completeError(error, stackTrace);
      }
      stream.removeListener(listener);
    },
  );

  stream.addListener(listener);
  return completer.future;
}
