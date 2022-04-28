import 'dart:convert';

import 'package:collection/collection.dart';

import 'package:immich_mobile/shared/models/immich_asset.model.dart';

class AssetSelectionPageResult {
  final Set<ImmichAsset> selectedNewAsset;
  final Set<ImmichAsset> selectedAdditionalAsset;
  final bool isAlbumExist;

  AssetSelectionPageResult({
    required this.selectedNewAsset,
    required this.selectedAdditionalAsset,
    required this.isAlbumExist,
  });

  AssetSelectionPageResult copyWith({
    Set<ImmichAsset>? selectedNewAsset,
    Set<ImmichAsset>? selectedAdditionalAsset,
    bool? isAlbumExist,
  }) {
    return AssetSelectionPageResult(
      selectedNewAsset: selectedNewAsset ?? this.selectedNewAsset,
      selectedAdditionalAsset: selectedAdditionalAsset ?? this.selectedAdditionalAsset,
      isAlbumExist: isAlbumExist ?? this.isAlbumExist,
    );
  }

  Map<String, dynamic> toMap() {
    final result = <String, dynamic>{};

    result.addAll({'selectedNewAsset': selectedNewAsset.map((x) => x.toMap()).toList()});
    result.addAll({'selectedAdditionalAsset': selectedAdditionalAsset.map((x) => x.toMap()).toList()});
    result.addAll({'isAlbumExist': isAlbumExist});

    return result;
  }

  factory AssetSelectionPageResult.fromMap(Map<String, dynamic> map) {
    return AssetSelectionPageResult(
      selectedNewAsset: Set<ImmichAsset>.from(map['selectedNewAsset']?.map((x) => ImmichAsset.fromMap(x))),
      selectedAdditionalAsset:
          Set<ImmichAsset>.from(map['selectedAdditionalAsset']?.map((x) => ImmichAsset.fromMap(x))),
      isAlbumExist: map['isAlbumExist'] ?? false,
    );
  }

  String toJson() => json.encode(toMap());

  factory AssetSelectionPageResult.fromJson(String source) => AssetSelectionPageResult.fromMap(json.decode(source));

  @override
  String toString() =>
      'AssetSelectionPageResult(selectedNewAsset: $selectedNewAsset, selectedAdditionalAsset: $selectedAdditionalAsset, isAlbumExist: $isAlbumExist)';

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    final setEquals = const DeepCollectionEquality().equals;

    return other is AssetSelectionPageResult &&
        setEquals(other.selectedNewAsset, selectedNewAsset) &&
        setEquals(other.selectedAdditionalAsset, selectedAdditionalAsset) &&
        other.isAlbumExist == isAlbumExist;
  }

  @override
  int get hashCode => selectedNewAsset.hashCode ^ selectedAdditionalAsset.hashCode ^ isAlbumExist.hashCode;
}
