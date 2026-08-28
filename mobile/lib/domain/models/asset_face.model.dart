// ignore_for_file: annotate_overrides

import 'package:freezed_annotation/freezed_annotation.dart';

part 'asset_face.model.freezed.dart';

// Model for an asset face stored in the server
@freezed
class const AssetFace({
  required final String id,
  required final String assetId,
  final String? personId,
  required final int imageWidth,
  required final int imageHeight,
  required final int boundingBoxX1,
  required final int boundingBoxY1,
  required final int boundingBoxX2,
  required final int boundingBoxY2,
  required final String sourceType,
}) with _$AssetFace;
