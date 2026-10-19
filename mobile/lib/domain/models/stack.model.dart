import 'package:flutter/foundation.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'stack.model.freezed.dart';

@freezed
abstract class StackResponse with _$StackResponse {
  const factory StackResponse({required String id, required String primaryAssetId, required List<String> assetIds}) =
      _StackResponse;
}
