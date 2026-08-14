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

class StackResponse {
  final String id;
  final String primaryAssetId;
  final List<String> assetIds;

  const StackResponse({required this.id, required this.primaryAssetId, required this.assetIds});

  @override
  bool operator ==(covariant StackResponse other) {
    if (identical(this, other)) {
      return true;
    }

    return other.id == id && other.primaryAssetId == primaryAssetId && other.assetIds == assetIds;
  }

  @override
  int get hashCode => id.hashCode ^ primaryAssetId.hashCode ^ assetIds.hashCode;
}
