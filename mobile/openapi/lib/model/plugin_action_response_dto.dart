//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class PluginActionResponseDto {
  /// Returns a new [PluginActionResponseDto] instance.
  PluginActionResponseDto({
    required this.description,
    required this.displayName,
    required this.id,
    required this.name,
    required this.pluginId,
    required this.schema,
    this.supportedContexts = const [],
  });

  String description;

  String displayName;

  String id;

  String name;

  String pluginId;

  Object? schema;

  List<String> supportedContexts;

  @override
  bool operator ==(Object other) => identical(this, other) || other is PluginActionResponseDto &&
    other.description == description &&
    other.displayName == displayName &&
    other.id == id &&
    other.name == name &&
    other.pluginId == pluginId &&
    other.schema == schema &&
    _deepEquality.equals(other.supportedContexts, supportedContexts);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (description.hashCode) +
    (displayName.hashCode) +
    (id.hashCode) +
    (name.hashCode) +
    (pluginId.hashCode) +
    (schema == null ? 0 : schema!.hashCode) +
    (supportedContexts.hashCode);

  @override
  String toString() => 'PluginActionResponseDto[description=$description, displayName=$displayName, id=$id, name=$name, pluginId=$pluginId, schema=$schema, supportedContexts=$supportedContexts]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'description'] = this.description;
      json[r'displayName'] = this.displayName;
      json[r'id'] = this.id;
      json[r'name'] = this.name;
      json[r'pluginId'] = this.pluginId;
    if (this.schema != null) {
      json[r'schema'] = this.schema;
    } else {
    //  json[r'schema'] = null;
    }
      json[r'supportedContexts'] = this.supportedContexts;
    return json;
  }

  /// Returns a new [PluginActionResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static PluginActionResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "PluginActionResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return PluginActionResponseDto(
        description: mapValueOfType<String>(json, r'description')!,
        displayName: mapValueOfType<String>(json, r'displayName')!,
        id: mapValueOfType<String>(json, r'id')!,
        name: mapValueOfType<String>(json, r'name')!,
        pluginId: mapValueOfType<String>(json, r'pluginId')!,
        schema: mapValueOfType<Object>(json, r'schema'),
        supportedContexts: PluginFilterResponseDtoSupportedContextsEnum.listFromJson(json[r'supportedContexts']),
      );
    }
    return null;
  }

  static List<PluginActionResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PluginActionResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PluginActionResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, PluginActionResponseDto> mapFromJson(dynamic json) {
    final map = <String, PluginActionResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = PluginActionResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of PluginActionResponseDto-objects as value to a dart map
  static Map<String, List<PluginActionResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<PluginActionResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = PluginActionResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'description',
    'displayName',
    'id',
    'name',
    'pluginId',
    'schema',
    'supportedContexts',
  };
}


class PluginFilterResponseDtoSupportedContextsEnum {
  /// Instantiate a new enum with the provided [value].
  const PluginFilterResponseDtoSupportedContextsEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const asset = PluginFilterResponseDtoSupportedContextsEnum._(r'asset');
  static const album = PluginFilterResponseDtoSupportedContextsEnum._(r'album');
  static const person = PluginFilterResponseDtoSupportedContextsEnum._(r'person');

  /// List of all possible values in this [enum][PluginFilterResponseDtoSupportedContextsEnum].
  static const values = <PluginFilterResponseDtoSupportedContextsEnum>[
    asset,
    album,
    person,
  ];

  static PluginFilterResponseDtoSupportedContextsEnum? fromJson(dynamic value) => PluginFilterResponseDtoSupportedContextsEnumTypeTransformer().decode(value);

  static List<PluginFilterResponseDtoSupportedContextsEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PluginFilterResponseDtoSupportedContextsEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PluginFilterResponseDtoSupportedContextsEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [PluginFilterResponseDtoSupportedContextsEnum] to String,
/// and [decode] dynamic data back to [PluginFilterResponseDtoSupportedContextsEnum].
class PluginFilterResponseDtoSupportedContextsEnumTypeTransformer {
  factory PluginFilterResponseDtoSupportedContextsEnumTypeTransformer() => _instance ??= const PluginFilterResponseDtoSupportedContextsEnumTypeTransformer._();

  const PluginFilterResponseDtoSupportedContextsEnumTypeTransformer._();

  String encode(PluginFilterResponseDtoSupportedContextsEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a PluginFilterResponseDtoSupportedContextsEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  PluginFilterResponseDtoSupportedContextsEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'asset': return PluginFilterResponseDtoSupportedContextsEnum.asset;
        case r'album': return PluginFilterResponseDtoSupportedContextsEnum.album;
        case r'person': return PluginFilterResponseDtoSupportedContextsEnum.person;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [PluginFilterResponseDtoSupportedContextsEnumTypeTransformer] instance.
  static PluginFilterResponseDtoSupportedContextsEnumTypeTransformer? _instance;
}


