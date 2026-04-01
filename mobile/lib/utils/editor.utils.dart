import 'dart:math';

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
  final x = (rect.left * originalWidth).truncate();
  final y = (rect.top * originalHeight).truncate();
  final width = (rect.width * originalWidth).truncate();
  final height = (rect.height * originalHeight).truncate();

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
          final parameters = RotateParameters.fromJson(edit.parameters);
          if (parameters == null) {
            throw ArgumentError("Unable to parse rotate parameters from edit: ${edit.parameters}");
          }

          final angleInDegrees = parameters.angle;
          final angleInRadians = angleInDegrees * pi / 180;
          return AffineMatrix.rotate(angleInRadians);

        case AssetEditAction.mirror:
          final parameters = MirrorParameters.fromJson(edit.parameters);
          if (parameters == null) {
            throw ArgumentError("Unable to parse mirror parameters from edit: ${edit.parameters}");
          }

          return parameters.axis == MirrorAxis.horizontal ? AffineMatrix.flipY() : AffineMatrix.flipX();
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
