import 'package:flutter/foundation.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'stack.model.freezed.dart';

// Model for a stack stored in the server
@freezed
abstract class Stack with _$Stack {
  const factory Stack({
    required String id,
    required DateTime createdAt,
    required DateTime updatedAt,
    required String ownerId,
    required String primaryAssetId,
  }) = _Stack;
}

@freezed
abstract class StackResponse with _$StackResponse {
  const factory StackResponse({required String id, required String primaryAssetId, required List<String> assetIds}) =
      _StackResponse;
}
