// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class BulkIdsDto {
  const BulkIdsDto({required this.ids});

  /// IDs to process
  final List<String> ids;

  static BulkIdsDto? fromJson(dynamic value) {
    ApiCompat.upgrade<BulkIdsDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(ids: ((json[r'ids'] as List?)?.map(($e) => $e as String).toList(growable: false))!);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'ids'] = ids;
    return json;
  }

  BulkIdsDto copyWith({List<String>? ids}) {
    return .new(ids: ids ?? this.ids);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is BulkIdsDto && const DeepCollectionEquality().equals(ids, other.ids));
  }

  @override
  int get hashCode {
    return Object.hashAll([const DeepCollectionEquality().hash(ids)]);
  }

  @override
  String toString() => 'BulkIdsDto(ids=$ids)';
}
