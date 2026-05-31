// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class TagCreateDto {
  const TagCreateDto({
    this.color = const Optional.absent(),
    required this.name,
    this.parentId = const Optional.absent(),
  });

  /// Tag color (hex)
  final Optional<String?> color;

  /// Tag name
  final String name;

  /// Parent tag ID
  final Optional<String?> parentId;

  static TagCreateDto? fromJson(dynamic value) {
    ApiCompat.upgrade<TagCreateDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      color: json.containsKey(r'color') ? Optional.present((json[r'color'] as String?)) : const Optional.absent(),
      name: json[r'name'] as String,
      parentId: json.containsKey(r'parentId')
          ? Optional.present((json[r'parentId'] as String?))
          : const Optional.absent(),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (color case Present(:final value)) {
      json[r'color'] = value;
    }
    json[r'name'] = name;
    if (parentId case Present(:final value)) {
      json[r'parentId'] = value;
    }
    return json;
  }

  TagCreateDto copyWith({Optional<String?>? color, String? name, Optional<String?>? parentId}) {
    return .new(color: color ?? this.color, name: name ?? this.name, parentId: parentId ?? this.parentId);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is TagCreateDto && color == other.color && name == other.name && parentId == other.parentId);
  }

  @override
  int get hashCode {
    return Object.hashAll([color, name, parentId]);
  }

  @override
  String toString() => 'TagCreateDto(color=$color, name=$name, parentId=$parentId)';
}
