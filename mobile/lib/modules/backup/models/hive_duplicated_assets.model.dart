import 'dart:convert';

import 'package:collection/collection.dart';
import 'package:hive/hive.dart';

part 'hive_duplicated_assets.model.g.dart';

@HiveType(typeId: 2)
class HiveDuplicatedAssets {
  @HiveField(0, defaultValue: [])
  List<String> duplicatedAssetIds;

  HiveDuplicatedAssets({
    required this.duplicatedAssetIds,
  });

  HiveDuplicatedAssets copyWith({
    List<String>? duplicatedAssetIds,
  }) {
    return HiveDuplicatedAssets(
      duplicatedAssetIds: duplicatedAssetIds ?? this.duplicatedAssetIds,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'duplicatedAssetIds': duplicatedAssetIds,
    };
  }

  factory HiveDuplicatedAssets.fromMap(Map<String, dynamic> map) {
    return HiveDuplicatedAssets(
      duplicatedAssetIds: List<String>.from(map['duplicatedAssetIds']),
    );
  }

  String toJson() => json.encode(toMap());

  factory HiveDuplicatedAssets.fromJson(String source) =>
      HiveDuplicatedAssets.fromMap(json.decode(source));

  @override
  String toString() =>
      'HiveDuplicatedAssets(duplicatedAssetIds: $duplicatedAssetIds)';

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    final listEquals = const DeepCollectionEquality().equals;

    return other is HiveDuplicatedAssets &&
        listEquals(other.duplicatedAssetIds, duplicatedAssetIds);
  }

  @override
  int get hashCode => duplicatedAssetIds.hashCode;
}
