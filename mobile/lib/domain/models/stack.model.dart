// ignore_for_file: annotate_overrides

import 'package:freezed_annotation/freezed_annotation.dart';

part 'stack.model.freezed.dart';

// Model for a stack stored in the server
@freezed
class const Stack({
  required final String id,
  required final DateTime createdAt,
  required final DateTime updatedAt,
  required final String ownerId,
  required final String primaryAssetId,
}) with _$Stack;

@freezed
class const StackResponse({
  required final String id,
  required final String primaryAssetId,
  required final List<String> assetIds,
}) with _$StackResponse;
