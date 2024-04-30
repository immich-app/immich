// ignore_for_file: public_member_api_docs, sort_constructors_first

import 'package:collection/collection.dart';

import 'package:immich_mobile/entities/asset.entity.dart';

class Memory {
  final String title;
  final List<Asset> assets;
  Memory({
    required this.title,
    required this.assets,
  });

  Memory copyWith({
    String? title,
    List<Asset>? assets,
  }) {
    return Memory(
      title: title ?? this.title,
      assets: assets ?? this.assets,
    );
  }

  @override
  String toString() => 'Memory(title: $title, assets: $assets)';

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    final listEquals = const DeepCollectionEquality().equals;

    return other is Memory &&
        other.title == title &&
        listEquals(other.assets, assets);
  }

  @override
  int get hashCode => title.hashCode ^ assets.hashCode;
}
