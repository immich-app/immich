import 'dart:math';

import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/asset_edit.model.dart';
import 'package:immich_mobile/domain/models/exif.model.dart';
import 'package:immich_mobile/domain/models/ocr.model.dart';
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
      return switch (edit) {
        RotateEdit(:final parameters) => AffineMatrix.rotate(parameters.angle * pi / 180),
        MirrorEdit(:final parameters) =>
          parameters.axis == MirrorAxis.horizontal ? AffineMatrix.flipY() : AffineMatrix.flipX(),
        CropEdit() => AffineMatrix.identity(),
      };
    }).toList(),
  );
}

bool isCloseToZero(double value, [double epsilon = 1e-15]) {
  return value.abs() < epsilon;
}

typedef NormalizedTransform = ({int rotation, bool mirrorHorizontal, bool mirrorVertical});

NormalizedTransform normalizeTransformEdits(List<AssetEdit> edits) {
  final matrix = buildAffineFromEdits(edits);

  final double a = matrix.a;
  final double b = matrix.b;
  final double c = matrix.c;
  final double d = matrix.d;

  final degrees = ((isCloseToZero(a) ? asin(c) : acos(a)) * 180) / pi;

  // We only allow 90 degree increments
  final quarterTurns = (degrees / 90).round() % 4;

  return (rotation: quarterTurns * 90, mirrorHorizontal: false, mirrorVertical: isCloseToZero(a) ? b == c : a == -d);
}

List<Ocr> applyEditsToOcr(List<Ocr> boxes, List<AssetEdit> edits, ExifInfo? exif) {
  late final width = exif!.isFlipped ? exif.height! : exif.width!;
  late final height = exif!.isFlipped ? exif.width! : exif.height!;

  Offset applyEdit(Offset point, AssetEdit edit) {
    return switch (edit) {
      CropEdit(:final parameters) => Offset(
        (point.dx * width - parameters.x) / parameters.width,
        (point.dy * height - parameters.y) / parameters.height,
      ),
      RotateEdit(:final parameters) => switch (parameters.angle) {
        90 => Offset(1 - point.dy, point.dx),
        180 => Offset(1 - point.dx, 1 - point.dy),
        270 => Offset(point.dy, 1 - point.dx),
        _ => point,
      },
      MirrorEdit(:final parameters) =>
        parameters.axis == MirrorAxis.horizontal ? Offset(1 - point.dx, point.dy) : Offset(point.dx, 1 - point.dy),
    };
  }

  // the server reorders the corners after a rotation, so the first one is top left again
  final quarterTurns = (edits.whereType<RotateEdit>().firstOrNull?.parameters.angle ?? 0) ~/ 90;

  return boxes.map((box) {
    final points = [
      Offset(box.x1, box.y1),
      Offset(box.x2, box.y2),
      Offset(box.x3, box.y3),
      Offset(box.x4, box.y4),
    ].map((point) => edits.fold(point, applyEdit)).toList();
    final [p1, p2, p3, p4] = List.generate(4, (i) => points[(i - quarterTurns) % 4]);

    return box.copyWith(x1: p1.dx, y1: p1.dy, x2: p2.dx, y2: p2.dy, x3: p3.dx, y3: p3.dy, x4: p4.dx, y4: p4.dy);
  }).toList();
}
