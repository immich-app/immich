import 'dart:convert';

import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';

part 'memory.model.freezed.dart';

// TODO(agg23): Remove enum suffix
enum MemoryTypeEnum {
  // do not change this order!
  onThisDay,
  birthday,
}

@Freezed(fromJson: false, toJson: false)
abstract class MemoryData with _$MemoryData {
  const MemoryData._();

  const factory MemoryData({required int year, String? personName}) = _MemoryData;

  Map<String, dynamic> toMap() {
    return <String, dynamic>{'year': year, 'personName': ?personName};
  }

  factory MemoryData.fromMap(Map<String, dynamic> map) {
    return MemoryData(year: map['year'] as int, personName: map['personName'] as String?);
  }

  @visibleForTesting
  String toJson() => json.encode(toMap());

  factory MemoryData.fromJson(String source) => MemoryData.fromMap(json.decode(source) as Map<String, dynamic>);
}

/// A specialized collection of assets with some novel display mechanism
// TODO(agg23): DriftMemoryRepository currently mutates `assets`
@Freezed(makeCollectionsUnmodifiable: false)
abstract class Memory with _$Memory {
  const factory Memory({
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
  }) = _Memory;
}
