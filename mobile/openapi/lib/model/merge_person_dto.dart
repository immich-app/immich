// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class MergePersonDto {
  const MergePersonDto({required this.ids});

  /// Person IDs to merge
  final List<String> ids;

  static MergePersonDto? fromJson(dynamic value) {
    ApiCompat.upgrade<MergePersonDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(ids: ((json[r'ids'] as List?)?.map(($e) => $e as String).toList(growable: false))!);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'ids'] = ids;
    return json;
  }

  MergePersonDto copyWith({List<String>? ids}) {
    return .new(ids: ids ?? this.ids);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is MergePersonDto && const DeepCollectionEquality().equals(ids, other.ids));
  }

  @override
  int get hashCode {
    return Object.hashAll([const DeepCollectionEquality().hash(ids)]);
  }

  @override
  String toString() => 'MergePersonDto(ids=$ids)';
}
