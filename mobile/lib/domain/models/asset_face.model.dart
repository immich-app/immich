import 'package:flutter/foundation.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'asset_face.model.freezed.dart';

// Model for an asset face stored in the server
@freezed
abstract class AssetFace with _$AssetFace {
  const factory AssetFace({
    required String id,
    required String assetId,
    String? personId,
    required int imageWidth,
    required int imageHeight,
    required int boundingBoxX1,
    required int boundingBoxY1,
    required int boundingBoxX2,
    required int boundingBoxY2,
    required String sourceType,
  }) = _AssetFace;
}
