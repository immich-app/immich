//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class PluginJsonSchemaProperty {
  /// Returns a new [PluginJsonSchemaProperty] instance.
  PluginJsonSchemaProperty({
    this.additionalProperties,
    this.default_,
    this.description,
    this.enum_ = const [],
    this.items,
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
  PluginJsonSchemaPropertyAdditionalProperties? additionalProperties;

  Object? default_;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? description;

  List<String> enum_;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  PluginJsonSchemaProperty? items;

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
  bool operator ==(Object other) => identical(this, other) || other is PluginJsonSchemaProperty &&
    other.additionalProperties == additionalProperties &&
    other.default_ == default_ &&
    other.description == description &&
    _deepEquality.equals(other.enum_, enum_) &&
    other.items == items &&
    _deepEquality.equals(other.properties, properties) &&
    _deepEquality.equals(other.required_, required_) &&
    other.type == type;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (additionalProperties == null ? 0 : additionalProperties!.hashCode) +
    (default_ == null ? 0 : default_!.hashCode) +
    (description == null ? 0 : description!.hashCode) +
    (enum_.hashCode) +
    (items == null ? 0 : items!.hashCode) +
    (properties.hashCode) +
    (required_.hashCode) +
    (type == null ? 0 : type!.hashCode);

  @override
  String toString() => 'PluginJsonSchemaProperty[additionalProperties=$additionalProperties, default_=$default_, description=$description, enum_=$enum_, items=$items, properties=$properties, required_=$required_, type=$type]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.additionalProperties != null) {
      json[r'additionalProperties'] = this.additionalProperties;
    } else {
    //  json[r'additionalProperties'] = null;
    }
    if (this.default_ != null) {
      json[r'default'] = this.default_;
    } else {
    //  json[r'default'] = null;
    }
    if (this.description != null) {
      json[r'description'] = this.description;
    } else {
    //  json[r'description'] = null;
    }
      json[r'enum'] = this.enum_;
    if (this.items != null) {
      json[r'items'] = this.items;
    } else {
    //  json[r'items'] = null;
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

  /// Returns a new [PluginJsonSchemaProperty] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static PluginJsonSchemaProperty? fromJson(dynamic value) {
    upgradeDto(value, "PluginJsonSchemaProperty");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return PluginJsonSchemaProperty(
        additionalProperties: PluginJsonSchemaPropertyAdditionalProperties.fromJson(json[r'additionalProperties']),
        default_: mapValueOfType<Object>(json, r'default'),
        description: mapValueOfType<String>(json, r'description'),
        enum_: json[r'enum'] is Iterable
            ? (json[r'enum'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        items: PluginJsonSchemaProperty.fromJson(json[r'items']),
        properties: PluginJsonSchemaProperty.mapFromJson(json[r'properties']),
        required_: json[r'required'] is Iterable
            ? (json[r'required'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        type: PluginJsonSchemaType.fromJson(json[r'type']),
      );
    }
    return null;
  }

  static List<PluginJsonSchemaProperty> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PluginJsonSchemaProperty>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PluginJsonSchemaProperty.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, PluginJsonSchemaProperty> mapFromJson(dynamic json) {
    final map = <String, PluginJsonSchemaProperty>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = PluginJsonSchemaProperty.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of PluginJsonSchemaProperty-objects as value to a dart map
  static Map<String, List<PluginJsonSchemaProperty>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<PluginJsonSchemaProperty>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = PluginJsonSchemaProperty.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

