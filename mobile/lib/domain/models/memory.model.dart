// ignore_for_file: annotate_overrides

import 'dart:convert';

import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';

part 'memory.model.freezed.dart';

// TODO(agg23): Remove enum suffix
enum MemoryTypeEnum {
  // do not change this order!
  onThisDay,
}

@Freezed(fromJson: false, toJson: false)
class const MemoryData({required final int year}) with _$MemoryData {
  Map<String, dynamic> toMap() {
    return <String, dynamic>{'year': year};
  }

  factory MemoryData.fromMap(Map<String, dynamic> map) {
    return MemoryData(year: map['year'] as int);
  }

  String toJson() => json.encode(toMap());

  factory MemoryData.fromJson(String source) => MemoryData.fromMap(json.decode(source) as Map<String, dynamic>);
}

// Model for a memory stored in the server
// TODO(agg23): DriftMemoryRepository currently mutates `assets`
@Freezed(makeCollectionsUnmodifiable: false)
class const DriftMemory({
  required final String id,
  required final DateTime createdAt,
  required final DateTime updatedAt,
  final DateTime? deletedAt,
  required final String ownerId,
  required final MemoryTypeEnum type,
  required final MemoryData data,
  required final bool isSaved,
  required final DateTime memoryAt,
  final DateTime? seenAt,
  final DateTime? showAt,
  final DateTime? hideAt,
  required final List<RemoteAsset> assets,
}) with _$DriftMemory;
