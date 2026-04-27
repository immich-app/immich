//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigClassificationCategoryDto {
  /// Returns a new [SystemConfigClassificationCategoryDto] instance.
  SystemConfigClassificationCategoryDto({
    required this.action,
    required this.enabled,
    this.faceExclusion,
    required this.name,
    this.prompts = const [],
    required this.similarity,
  });

  /// Action to take when an asset matches
  SystemConfigClassificationCategoryDtoActionEnum action;

  /// Whether this category is enabled
  bool enabled;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  ClassificationFaceExclusion? faceExclusion;

  /// Category name
  String name;

  /// CLIP text prompts for this category
  List<String> prompts;

  /// Cosine similarity threshold for matching this category
  ///
  /// Minimum value: 0
  /// Maximum value: 1
  double similarity;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigClassificationCategoryDto &&
    other.action == action &&
    other.enabled == enabled &&
    other.faceExclusion == faceExclusion &&
    other.name == name &&
    _deepEquality.equals(other.prompts, prompts) &&
    other.similarity == similarity;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (action.hashCode) +
    (enabled.hashCode) +
    (faceExclusion == null ? 0 : faceExclusion!.hashCode) +
    (name.hashCode) +
    (prompts.hashCode) +
    (similarity.hashCode);

  @override
  String toString() => 'SystemConfigClassificationCategoryDto[action=$action, enabled=$enabled, faceExclusion=$faceExclusion, name=$name, prompts=$prompts, similarity=$similarity]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'action'] = this.action;
      json[r'enabled'] = this.enabled;
    if (this.faceExclusion != null) {
      json[r'faceExclusion'] = this.faceExclusion;
    } else {
    //  json[r'faceExclusion'] = null;
    }
      json[r'name'] = this.name;
      json[r'prompts'] = this.prompts;
      json[r'similarity'] = this.similarity;
    return json;
  }

  /// Returns a new [SystemConfigClassificationCategoryDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigClassificationCategoryDto? fromJson(dynamic value) {
    upgradeDto(value, "SystemConfigClassificationCategoryDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SystemConfigClassificationCategoryDto(
        action: SystemConfigClassificationCategoryDtoActionEnum.fromJson(json[r'action'])!,
        enabled: mapValueOfType<bool>(json, r'enabled')!,
        faceExclusion: ClassificationFaceExclusion.fromJson(json[r'faceExclusion']),
        name: mapValueOfType<String>(json, r'name')!,
        prompts: json[r'prompts'] is Iterable
            ? (json[r'prompts'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        similarity: (mapValueOfType<num>(json, r'similarity')!).toDouble(),
      );
    }
    return null;
  }

  static List<SystemConfigClassificationCategoryDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigClassificationCategoryDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigClassificationCategoryDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SystemConfigClassificationCategoryDto> mapFromJson(dynamic json) {
    final map = <String, SystemConfigClassificationCategoryDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigClassificationCategoryDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SystemConfigClassificationCategoryDto-objects as value to a dart map
  static Map<String, List<SystemConfigClassificationCategoryDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SystemConfigClassificationCategoryDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SystemConfigClassificationCategoryDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'action',
    'enabled',
    'name',
    'prompts',
    'similarity',
  };
}

/// Action to take when an asset matches
class SystemConfigClassificationCategoryDtoActionEnum {
  /// Instantiate a new enum with the provided [value].
  const SystemConfigClassificationCategoryDtoActionEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const tag = SystemConfigClassificationCategoryDtoActionEnum._(r'tag');
  static const tagAndArchive = SystemConfigClassificationCategoryDtoActionEnum._(r'tag_and_archive');

  /// List of all possible values in this [enum][SystemConfigClassificationCategoryDtoActionEnum].
  static const values = <SystemConfigClassificationCategoryDtoActionEnum>[
    tag,
    tagAndArchive,
  ];

  static SystemConfigClassificationCategoryDtoActionEnum? fromJson(dynamic value) => SystemConfigClassificationCategoryDtoActionEnumTypeTransformer().decode(value);

  static List<SystemConfigClassificationCategoryDtoActionEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigClassificationCategoryDtoActionEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigClassificationCategoryDtoActionEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [SystemConfigClassificationCategoryDtoActionEnum] to String,
/// and [decode] dynamic data back to [SystemConfigClassificationCategoryDtoActionEnum].
class SystemConfigClassificationCategoryDtoActionEnumTypeTransformer {
  factory SystemConfigClassificationCategoryDtoActionEnumTypeTransformer() => _instance ??= const SystemConfigClassificationCategoryDtoActionEnumTypeTransformer._();

  const SystemConfigClassificationCategoryDtoActionEnumTypeTransformer._();

  String encode(SystemConfigClassificationCategoryDtoActionEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a SystemConfigClassificationCategoryDtoActionEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  SystemConfigClassificationCategoryDtoActionEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'tag': return SystemConfigClassificationCategoryDtoActionEnum.tag;
        case r'tag_and_archive': return SystemConfigClassificationCategoryDtoActionEnum.tagAndArchive;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [SystemConfigClassificationCategoryDtoActionEnumTypeTransformer] instance.
  static SystemConfigClassificationCategoryDtoActionEnumTypeTransformer? _instance;
}


