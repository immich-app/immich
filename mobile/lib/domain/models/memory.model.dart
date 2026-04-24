// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'dart:convert';

import 'package:collection/collection.dart';

import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';

enum MemoryTypeEnum {
  // do not change this order!
  onThisDay,
  rule,
}

class MemoryData {
  final Map<String, dynamic> raw;

  const MemoryData(this.raw);

  int? get year => raw['year'] is int ? raw['year'] as int : (raw['year'] as num?)?.toInt();

  String? get ruleId => raw['ruleId'] as String?;

  String? get title => raw['title'] as String?;

  String? get subtitle => raw['subtitle'] as String?;

  MemoryData copyWith({Map<String, dynamic>? raw}) {
    return MemoryData(raw ?? this.raw);
  }

  Map<String, dynamic> toMap() {
    return Map<String, dynamic>.from(raw);
  }

  factory MemoryData.fromMap(Map<String, dynamic> map) {
    return MemoryData(Map<String, dynamic>.from(map));
  }

  String toJson() => json.encode(toMap());

  factory MemoryData.fromJson(String source) => MemoryData.fromMap(json.decode(source) as Map<String, dynamic>);

  @override
  String toString() => 'MemoryData(raw: $raw)';

  @override
  bool operator ==(covariant MemoryData other) {
    if (identical(this, other)) return true;

    return const DeepCollectionEquality().equals(other.raw, raw);
  }

  @override
  int get hashCode => const DeepCollectionEquality().hash(raw);
}

// Model for a memory stored in the server
class DriftMemory {
  final String id;
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime? deletedAt;
  final String ownerId;

  // enum
  final MemoryTypeEnum type;
  final MemoryData data;
  final bool isSaved;
  final DateTime memoryAt;
  final DateTime? seenAt;
  final DateTime? showAt;
  final DateTime? hideAt;
  final List<RemoteAsset> assets;

  const DriftMemory({
    required this.id,
    required this.createdAt,
    required this.updatedAt,
    this.deletedAt,
    required this.ownerId,
    required this.type,
    required this.data,
    required this.isSaved,
    required this.memoryAt,
    this.seenAt,
    this.showAt,
    this.hideAt,
    required this.assets,
  });

  DriftMemory copyWith({
    String? id,
    DateTime? createdAt,
    DateTime? updatedAt,
    DateTime? deletedAt,
    String? ownerId,
    MemoryTypeEnum? type,
    MemoryData? data,
    bool? isSaved,
    DateTime? memoryAt,
    DateTime? seenAt,
    DateTime? showAt,
    DateTime? hideAt,
    List<RemoteAsset>? assets,
  }) {
    return DriftMemory(
      id: id ?? this.id,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      deletedAt: deletedAt ?? this.deletedAt,
      ownerId: ownerId ?? this.ownerId,
      type: type ?? this.type,
      data: data ?? this.data,
      isSaved: isSaved ?? this.isSaved,
      memoryAt: memoryAt ?? this.memoryAt,
      seenAt: seenAt ?? this.seenAt,
      showAt: showAt ?? this.showAt,
      hideAt: hideAt ?? this.hideAt,
      assets: assets ?? this.assets,
    );
  }

  @override
  String toString() {
    return '''Memory {
    id: $id,
    createdAt: $createdAt,
    updatedAt: $updatedAt,
    deletedAt: ${deletedAt ?? "<NA>"},
    ownerId: $ownerId,
    type: $type,
    data: $data,
    isSaved: $isSaved,
    memoryAt: $memoryAt,
    seenAt: ${seenAt ?? "<NA>"},
    showAt: ${showAt ?? "<NA>"},
    hideAt: ${hideAt ?? "<NA>"},
    assets: $assets
}''';
  }

  @override
  bool operator ==(covariant DriftMemory other) {
    if (identical(this, other)) return true;
    final listEquals = const DeepCollectionEquality().equals;

    return other.id == id &&
        other.createdAt == createdAt &&
        other.updatedAt == updatedAt &&
        other.deletedAt == deletedAt &&
        other.ownerId == ownerId &&
        other.type == type &&
        other.data == data &&
        other.isSaved == isSaved &&
        other.memoryAt == memoryAt &&
        other.seenAt == seenAt &&
        other.showAt == showAt &&
        other.hideAt == hideAt &&
        listEquals(other.assets, assets);
  }

  @override
  int get hashCode {
    return id.hashCode ^
        createdAt.hashCode ^
        updatedAt.hashCode ^
        deletedAt.hashCode ^
        ownerId.hashCode ^
        type.hashCode ^
        data.hashCode ^
        isSaved.hashCode ^
        memoryAt.hashCode ^
        seenAt.hashCode ^
        showAt.hashCode ^
        hideAt.hashCode ^
        assets.hashCode;
  }
}
