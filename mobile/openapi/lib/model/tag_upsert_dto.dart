// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class TagUpsertDto {
  const TagUpsertDto({required this.tags});

  /// Tag names to upsert
  final List<String> tags;

  static TagUpsertDto? fromJson(dynamic value) {
    ApiCompat.upgrade<TagUpsertDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(tags: ((json[r'tags'] as List?)?.map(($e) => $e as String).toList(growable: false))!);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'tags'] = tags;
    return json;
  }

  TagUpsertDto copyWith({List<String>? tags}) {
    return .new(tags: tags ?? this.tags);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is TagUpsertDto && const DeepCollectionEquality().equals(tags, other.tags));
  }

  @override
  int get hashCode {
    return Object.hashAll([const DeepCollectionEquality().hash(tags)]);
  }

  @override
  String toString() => 'TagUpsertDto(tags=$tags)';
}
