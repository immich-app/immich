// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class PluginMethodResponseDto {
  const PluginMethodResponseDto({
    required this.description,
    required this.hostFunctions,
    required this.key,
    required this.name,
    this.schema,
    required this.title,
    required this.types,
    required this.uiHints,
  });

  /// Description
  final String description;

  final bool hostFunctions;

  /// Key
  final String key;

  /// Name
  final String name;

  final Map<String, dynamic>? schema;

  /// Title
  final String title;

  /// Workflow types
  final List<WorkflowType> types;

  /// Ui hints
  final List<String> uiHints;

  static const _undefined = Object();

  static PluginMethodResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<PluginMethodResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      description: json[r'description'] as String,
      hostFunctions: json[r'hostFunctions'] as bool,
      key: json[r'key'] as String,
      name: json[r'name'] as String,
      schema: (json[r'schema'] as Map?)?.cast<String, dynamic>(),
      title: json[r'title'] as String,
      types: ((json[r'types'] as List?)?.map(($e) => (WorkflowType.fromJson($e))!).toList(growable: false))!,
      uiHints: ((json[r'uiHints'] as List?)?.map(($e) => $e as String).toList(growable: false))!,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'description'] = description;
    json[r'hostFunctions'] = hostFunctions;
    json[r'key'] = key;
    json[r'name'] = name;
    if (schema != null) {
      json[r'schema'] = schema!;
    }
    json[r'title'] = title;
    json[r'types'] = types.map(($e) => $e.toJson()).toList(growable: false);
    json[r'uiHints'] = uiHints;
    return json;
  }

  PluginMethodResponseDto copyWith({
    String? description,
    bool? hostFunctions,
    String? key,
    String? name,
    Object? schema = _undefined,
    String? title,
    List<WorkflowType>? types,
    List<String>? uiHints,
  }) {
    return .new(
      description: description ?? this.description,
      hostFunctions: hostFunctions ?? this.hostFunctions,
      key: key ?? this.key,
      name: name ?? this.name,
      schema: identical(schema, _undefined) ? this.schema : schema as Map<String, dynamic>?,
      title: title ?? this.title,
      types: types ?? this.types,
      uiHints: uiHints ?? this.uiHints,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is PluginMethodResponseDto &&
            description == other.description &&
            hostFunctions == other.hostFunctions &&
            key == other.key &&
            name == other.name &&
            const DeepCollectionEquality().equals(schema, other.schema) &&
            title == other.title &&
            const DeepCollectionEquality().equals(types, other.types) &&
            const DeepCollectionEquality().equals(uiHints, other.uiHints));
  }

  @override
  int get hashCode {
    return Object.hashAll([
      description,
      hostFunctions,
      key,
      name,
      const DeepCollectionEquality().hash(schema),
      title,
      const DeepCollectionEquality().hash(types),
      const DeepCollectionEquality().hash(uiHints),
    ]);
  }

  @override
  String toString() =>
      'PluginMethodResponseDto(description=$description, hostFunctions=$hostFunctions, key=$key, name=$name, schema=$schema, title=$title, types=$types, uiHints=$uiHints)';
}
