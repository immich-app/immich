//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ClassificationCategoryUpdateDto {
  /// Returns a new [ClassificationCategoryUpdateDto] instance.
  ClassificationCategoryUpdateDto({
    this.action,
    this.enabled,
    this.name,
    this.prompts = const [],
    this.similarity,
  });

  /// Action on match
  ClassificationCategoryUpdateDtoActionEnum? action;

  /// Enable or disable category
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? enabled;

  /// Category name
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? name;

  /// Text prompts for CLIP matching
  List<String> prompts;

  /// Similarity threshold (0-1, higher = stricter)
  ///
  /// Minimum value: 0
  /// Maximum value: 1
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  num? similarity;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ClassificationCategoryUpdateDto &&
    other.action == action &&
    other.enabled == enabled &&
    other.name == name &&
    _deepEquality.equals(other.prompts, prompts) &&
    other.similarity == similarity;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (action == null ? 0 : action!.hashCode) +
    (enabled == null ? 0 : enabled!.hashCode) +
    (name == null ? 0 : name!.hashCode) +
    (prompts.hashCode) +
    (similarity == null ? 0 : similarity!.hashCode);

  @override
  String toString() => 'ClassificationCategoryUpdateDto[action=$action, enabled=$enabled, name=$name, prompts=$prompts, similarity=$similarity]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.action != null) {
      json[r'action'] = this.action;
    } else {
    //  json[r'action'] = null;
    }
    if (this.enabled != null) {
      json[r'enabled'] = this.enabled;
    } else {
    //  json[r'enabled'] = null;
    }
    if (this.name != null) {
      json[r'name'] = this.name;
    } else {
    //  json[r'name'] = null;
    }
      json[r'prompts'] = this.prompts;
    if (this.similarity != null) {
      json[r'similarity'] = this.similarity;
    } else {
    //  json[r'similarity'] = null;
    }
    return json;
  }

  /// Returns a new [ClassificationCategoryUpdateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ClassificationCategoryUpdateDto? fromJson(dynamic value) {
    upgradeDto(value, "ClassificationCategoryUpdateDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ClassificationCategoryUpdateDto(
        action: ClassificationCategoryUpdateDtoActionEnum.fromJson(json[r'action']),
        enabled: mapValueOfType<bool>(json, r'enabled'),
        name: mapValueOfType<String>(json, r'name'),
        prompts: json[r'prompts'] is Iterable
            ? (json[r'prompts'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        similarity: json[r'similarity'] == null
            ? null
            : num.parse('${json[r'similarity']}'),
      );
    }
    return null;
  }

  static List<ClassificationCategoryUpdateDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ClassificationCategoryUpdateDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ClassificationCategoryUpdateDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ClassificationCategoryUpdateDto> mapFromJson(dynamic json) {
    final map = <String, ClassificationCategoryUpdateDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ClassificationCategoryUpdateDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ClassificationCategoryUpdateDto-objects as value to a dart map
  static Map<String, List<ClassificationCategoryUpdateDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ClassificationCategoryUpdateDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ClassificationCategoryUpdateDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

/// Action on match
class ClassificationCategoryUpdateDtoActionEnum {
  /// Instantiate a new enum with the provided [value].
  const ClassificationCategoryUpdateDtoActionEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const tag = ClassificationCategoryUpdateDtoActionEnum._(r'tag');
  static const tagAndArchive = ClassificationCategoryUpdateDtoActionEnum._(r'tag_and_archive');

  /// List of all possible values in this [enum][ClassificationCategoryUpdateDtoActionEnum].
  static const values = <ClassificationCategoryUpdateDtoActionEnum>[
    tag,
    tagAndArchive,
  ];

  static ClassificationCategoryUpdateDtoActionEnum? fromJson(dynamic value) => ClassificationCategoryUpdateDtoActionEnumTypeTransformer().decode(value);

  static List<ClassificationCategoryUpdateDtoActionEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ClassificationCategoryUpdateDtoActionEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ClassificationCategoryUpdateDtoActionEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [ClassificationCategoryUpdateDtoActionEnum] to String,
/// and [decode] dynamic data back to [ClassificationCategoryUpdateDtoActionEnum].
class ClassificationCategoryUpdateDtoActionEnumTypeTransformer {
  factory ClassificationCategoryUpdateDtoActionEnumTypeTransformer() => _instance ??= const ClassificationCategoryUpdateDtoActionEnumTypeTransformer._();

  const ClassificationCategoryUpdateDtoActionEnumTypeTransformer._();

  String encode(ClassificationCategoryUpdateDtoActionEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a ClassificationCategoryUpdateDtoActionEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  ClassificationCategoryUpdateDtoActionEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'tag': return ClassificationCategoryUpdateDtoActionEnum.tag;
        case r'tag_and_archive': return ClassificationCategoryUpdateDtoActionEnum.tagAndArchive;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [ClassificationCategoryUpdateDtoActionEnumTypeTransformer] instance.
  static ClassificationCategoryUpdateDtoActionEnumTypeTransformer? _instance;
}


