//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class PluginJsonSchema {
  /// Returns a new [PluginJsonSchema] instance.
  PluginJsonSchema({
    this.additionalProperties,
    this.description,
    this.properties = const {},
    this.required_ = const [],
    this.type,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? additionalProperties;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? description;

  Map<String, PluginJsonSchemaProperty> properties;

  List<String> required_;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  PluginJsonSchemaType? type;

  @override
  bool operator ==(Object other) => identical(this, other) || other is PluginJsonSchema &&
    other.additionalProperties == additionalProperties &&
    other.description == description &&
    _deepEquality.equals(other.properties, properties) &&
    _deepEquality.equals(other.required_, required_) &&
    other.type == type;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (additionalProperties == null ? 0 : additionalProperties!.hashCode) +
    (description == null ? 0 : description!.hashCode) +
    (properties.hashCode) +
    (required_.hashCode) +
    (type == null ? 0 : type!.hashCode);

  @override
  String toString() => 'PluginJsonSchema[additionalProperties=$additionalProperties, description=$description, properties=$properties, required_=$required_, type=$type]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.additionalProperties != null) {
      json[r'additionalProperties'] = this.additionalProperties;
    } else {
    //  json[r'additionalProperties'] = null;
    }
    if (this.description != null) {
      json[r'description'] = this.description;
    } else {
    //  json[r'description'] = null;
    }
      json[r'properties'] = this.properties;
      json[r'required'] = this.required_;
    if (this.type != null) {
      json[r'type'] = this.type;
    } else {
    //  json[r'type'] = null;
    }
    return json;
  }

  /// Returns a new [PluginJsonSchema] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static PluginJsonSchema? fromJson(dynamic value) {
    upgradeDto(value, "PluginJsonSchema");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return PluginJsonSchema(
        additionalProperties: mapValueOfType<bool>(json, r'additionalProperties'),
        description: mapValueOfType<String>(json, r'description'),
        properties: PluginJsonSchemaProperty.mapFromJson(json[r'properties']),
        required_: json[r'required'] is Iterable
            ? (json[r'required'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        type: PluginJsonSchemaType.fromJson(json[r'type']),
      );
    }
    return null;
  }

  static List<PluginJsonSchema> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PluginJsonSchema>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PluginJsonSchema.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, PluginJsonSchema> mapFromJson(dynamic json) {
    final map = <String, PluginJsonSchema>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = PluginJsonSchema.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of PluginJsonSchema-objects as value to a dart map
  static Map<String, List<PluginJsonSchema>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<PluginJsonSchema>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = PluginJsonSchema.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

