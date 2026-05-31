// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class PluginResponseDto {
  const PluginResponseDto({
    required this.author,
    required this.createdAt,
    required this.description,
    required this.id,
    required this.methods,
    required this.name,
    required this.title,
    required this.updatedAt,
    required this.version,
  });

  /// Plugin author
  final String author;

  /// Creation date
  final String createdAt;

  /// Plugin description
  final String description;

  /// Plugin ID
  final String id;

  /// Plugin methods
  final List<PluginMethodResponseDto> methods;

  /// Plugin name
  final String name;

  /// Plugin title
  final String title;

  /// Last update date
  final String updatedAt;

  /// Plugin version
  final String version;

  static PluginResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<PluginResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      author: json[r'author'] as String,
      createdAt: json[r'createdAt'] as String,
      description: json[r'description'] as String,
      id: json[r'id'] as String,
      methods: ((json[r'methods'] as List?)
          ?.map(($e) => (PluginMethodResponseDto.fromJson($e))!)
          .toList(growable: false))!,
      name: json[r'name'] as String,
      title: json[r'title'] as String,
      updatedAt: json[r'updatedAt'] as String,
      version: json[r'version'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'author'] = author;
    json[r'createdAt'] = createdAt;
    json[r'description'] = description;
    json[r'id'] = id;
    json[r'methods'] = methods.map(($e) => $e.toJson()).toList(growable: false);
    json[r'name'] = name;
    json[r'title'] = title;
    json[r'updatedAt'] = updatedAt;
    json[r'version'] = version;
    return json;
  }

  PluginResponseDto copyWith({
    String? author,
    String? createdAt,
    String? description,
    String? id,
    List<PluginMethodResponseDto>? methods,
    String? name,
    String? title,
    String? updatedAt,
    String? version,
  }) {
    return .new(
      author: author ?? this.author,
      createdAt: createdAt ?? this.createdAt,
      description: description ?? this.description,
      id: id ?? this.id,
      methods: methods ?? this.methods,
      name: name ?? this.name,
      title: title ?? this.title,
      updatedAt: updatedAt ?? this.updatedAt,
      version: version ?? this.version,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is PluginResponseDto &&
            author == other.author &&
            createdAt == other.createdAt &&
            description == other.description &&
            id == other.id &&
            const DeepCollectionEquality().equals(methods, other.methods) &&
            name == other.name &&
            title == other.title &&
            updatedAt == other.updatedAt &&
            version == other.version);
  }

  @override
  int get hashCode {
    return Object.hashAll([
      author,
      createdAt,
      description,
      id,
      const DeepCollectionEquality().hash(methods),
      name,
      title,
      updatedAt,
      version,
    ]);
  }

  @override
  String toString() =>
      'PluginResponseDto(author=$author, createdAt=$createdAt, description=$description, id=$id, methods=$methods, name=$name, title=$title, updatedAt=$updatedAt, version=$version)';
}
