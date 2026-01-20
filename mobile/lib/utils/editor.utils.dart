import 'dart:math';

import 'package:flutter/widgets.dart';
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

(double, bool, bool) normalizeTransformEdits(List<AssetEdit> edits) {
  double rotation = 0;
  bool flipX = false;
  bool flipY = false;

  final matrix = buildAffineFromEdits(edits);

  // round to avoid floating point precision issues
  int a = matrix.a.round();
  int b = matrix.b.round();
  int c = matrix.c.round();
  int d = matrix.d.round();

  // [ +/-1, 0, 0, +/-1 ] indicates a 0° or 180° rotation with possible mirrors
  // [ 0, +/-1, +/-1, 0 ] indicates a 90° or 270° rotation with possible mirrors
  if (a.abs() == 1 && b.abs() == 0 && c.abs() == 0 && d.abs() == 1) {
    rotation = a > 0 ? 0 : 180;
    flipX = rotation == 0 ? a < 0 : a > 0;
    flipY = rotation == 0 ? d < 0 : d > 0;
  } else if (a.abs() == 0 && b.abs() == 1 && c.abs() == 1 && d.abs() == 0) {
    rotation = c > 0 ? 90 : 270;
    flipX = rotation == 90 ? c < 0 : c > 0;
    flipY = rotation == 90 ? b > 0 : b < 0;
  }

  return (rotation, flipX, flipY);
}
