// ignore_for_file: annotate_overrides

import 'package:freezed_annotation/freezed_annotation.dart';

part 'ocr.model.freezed.dart';

@freezed
class const Ocr({
  required final String id,
  required final String assetId,
  required final double x1,
  required final double y1,
  required final double x2,
  required final double y2,
  required final double x3,
  required final double y3,
  required final double x4,
  required final double y4,
  required final double boxScore,
  required final double textScore,
  required final String text,
  required final bool isVisible,
}) with _$Ocr;
