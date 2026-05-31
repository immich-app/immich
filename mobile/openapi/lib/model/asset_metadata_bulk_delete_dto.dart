// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class AssetMetadataBulkDeleteDto {
  const AssetMetadataBulkDeleteDto({required this.items});

  /// Metadata items to delete
  final List<AssetMetadataBulkDeleteItemDto> items;

  static AssetMetadataBulkDeleteDto? fromJson(dynamic value) {
    ApiCompat.upgrade<AssetMetadataBulkDeleteDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      items: ((json[r'items'] as List?)
          ?.map(($e) => (AssetMetadataBulkDeleteItemDto.fromJson($e))!)
          .toList(growable: false))!,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'items'] = items.map(($e) => $e.toJson()).toList(growable: false);
    return json;
  }

  AssetMetadataBulkDeleteDto copyWith({List<AssetMetadataBulkDeleteItemDto>? items}) {
    return .new(items: items ?? this.items);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is AssetMetadataBulkDeleteDto && const DeepCollectionEquality().equals(items, other.items));
  }

  @override
  int get hashCode {
    return Object.hashAll([const DeepCollectionEquality().hash(items)]);
  }

  @override
  String toString() => 'AssetMetadataBulkDeleteDto(items=$items)';
}
