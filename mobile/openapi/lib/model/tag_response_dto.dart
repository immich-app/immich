// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class TagResponseDto {
  const TagResponseDto({
    this.color,
    required this.createdAt,
    required this.id,
    required this.name,
    this.parentId,
    required this.updatedAt,
    required this.value,
  });

  /// Tag color (hex)
  final String? color;

  /// Creation date
  final DateTime createdAt;

  /// Tag ID
  final String id;

  /// Tag name
  final String name;

  /// Parent tag ID
  final String? parentId;

  /// Last update date
  final DateTime updatedAt;

  /// Tag value (full path)
  final String value;

  static const _undefined = Object();

  static TagResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<TagResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      color: (json[r'color'] as String?),
      createdAt: DateTime.parse(json[r'createdAt'] as String),
      id: json[r'id'] as String,
      name: json[r'name'] as String,
      parentId: (json[r'parentId'] as String?),
      updatedAt: DateTime.parse(json[r'updatedAt'] as String),
      value: json[r'value'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (color != null) {
      json[r'color'] = color!;
    }
    json[r'createdAt'] = createdAt.toUtc().toIso8601String();
    json[r'id'] = id;
    json[r'name'] = name;
    if (parentId != null) {
      json[r'parentId'] = parentId!;
    }
    json[r'updatedAt'] = updatedAt.toUtc().toIso8601String();
    json[r'value'] = value;
    return json;
  }

  TagResponseDto copyWith({
    Object? color = _undefined,
    DateTime? createdAt,
    String? id,
    String? name,
    Object? parentId = _undefined,
    DateTime? updatedAt,
    String? value,
  }) {
    return .new(
      color: identical(color, _undefined) ? this.color : color as String?,
      createdAt: createdAt ?? this.createdAt,
      id: id ?? this.id,
      name: name ?? this.name,
      parentId: identical(parentId, _undefined) ? this.parentId : parentId as String?,
      updatedAt: updatedAt ?? this.updatedAt,
      value: value ?? this.value,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is TagResponseDto &&
            color == other.color &&
            createdAt == other.createdAt &&
            id == other.id &&
            name == other.name &&
            parentId == other.parentId &&
            updatedAt == other.updatedAt &&
            value == other.value);
  }

  @override
  int get hashCode {
    return Object.hashAll([color, createdAt, id, name, parentId, updatedAt, value]);
  }

  @override
  String toString() =>
      'TagResponseDto(color=$color, createdAt=$createdAt, id=$id, name=$name, parentId=$parentId, updatedAt=$updatedAt, value=$value)';
}
