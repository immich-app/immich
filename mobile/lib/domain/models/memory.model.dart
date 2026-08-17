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
abstract class MemoryData with _$MemoryData {
  const MemoryData._();

  const factory MemoryData({required int year}) = _MemoryData;

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
abstract class DriftMemory with _$DriftMemory {
  const factory DriftMemory({
    required String id,
    required DateTime createdAt,
    required DateTime updatedAt,
    DateTime? deletedAt,
    required String ownerId,
    required MemoryTypeEnum type,
    required MemoryData data,
    required bool isSaved,
    required DateTime memoryAt,
    DateTime? seenAt,
    DateTime? showAt,
    DateTime? hideAt,
    required List<RemoteAsset> assets,
  }) = _DriftMemory;
}
