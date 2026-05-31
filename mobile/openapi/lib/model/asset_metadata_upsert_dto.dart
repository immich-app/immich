// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class AssetMetadataUpsertDto {
  const AssetMetadataUpsertDto({required this.items});

  /// Metadata items to upsert
  final List<AssetMetadataUpsertItemDto> items;

  static AssetMetadataUpsertDto? fromJson(dynamic value) {
    ApiCompat.upgrade<AssetMetadataUpsertDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      items: ((json[r'items'] as List?)
          ?.map(($e) => (AssetMetadataUpsertItemDto.fromJson($e))!)
          .toList(growable: false))!,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'items'] = items.map(($e) => $e.toJson()).toList(growable: false);
    return json;
  }

  AssetMetadataUpsertDto copyWith({List<AssetMetadataUpsertItemDto>? items}) {
    return .new(items: items ?? this.items);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is AssetMetadataUpsertDto && const DeepCollectionEquality().equals(items, other.items));
  }

  @override
  int get hashCode {
    return Object.hashAll([const DeepCollectionEquality().hash(items)]);
  }

  @override
  String toString() => 'AssetMetadataUpsertDto(items=$items)';
}
