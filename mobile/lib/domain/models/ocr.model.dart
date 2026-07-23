import 'package:freezed_annotation/freezed_annotation.dart';

part 'ocr.model.freezed.dart';

@freezed
abstract class Ocr with _$Ocr {
  const factory Ocr({
    required String id,
    required String assetId,
    required double x1,
    required double y1,
    required double x2,
    required double y2,
    required double x3,
    required double y3,
    required double x4,
    required double y4,
    required double boxScore,
    required double textScore,
    required String text,
    required bool isVisible,
  }) = _Ocr;
}
