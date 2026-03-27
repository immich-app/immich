//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ClassificationCategoryCreateDto {
  /// Returns a new [ClassificationCategoryCreateDto] instance.
  ClassificationCategoryCreateDto({
    this.action,
    required this.name,
    this.prompts = const [],
    this.similarity = 0.28,
  });

  /// Action on match
  ClassificationCategoryCreateDtoActionEnum? action;

  /// Category name
  String name;

  /// Text prompts for CLIP matching
  List<String> prompts;

  /// Similarity threshold (0-1, higher = stricter)
  ///
  /// Minimum value: 0
  /// Maximum value: 1
  num similarity;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ClassificationCategoryCreateDto &&
    other.action == action &&
    other.name == name &&
    _deepEquality.equals(other.prompts, prompts) &&
    other.similarity == similarity;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (action == null ? 0 : action!.hashCode) +
    (name.hashCode) +
    (prompts.hashCode) +
    (similarity.hashCode);

  @override
  String toString() => 'ClassificationCategoryCreateDto[action=$action, name=$name, prompts=$prompts, similarity=$similarity]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.action != null) {
      json[r'action'] = this.action;
    } else {
    //  json[r'action'] = null;
    }
      json[r'name'] = this.name;
      json[r'prompts'] = this.prompts;
      json[r'similarity'] = this.similarity;
    return json;
  }

  /// Returns a new [ClassificationCategoryCreateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ClassificationCategoryCreateDto? fromJson(dynamic value) {
    upgradeDto(value, "ClassificationCategoryCreateDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ClassificationCategoryCreateDto(
        action: ClassificationCategoryCreateDtoActionEnum.fromJson(json[r'action']),
        name: mapValueOfType<String>(json, r'name')!,
        prompts: json[r'prompts'] is Iterable
            ? (json[r'prompts'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        similarity: num.parse('${json[r'similarity']}'),
      );
    }
    return null;
  }

  static List<ClassificationCategoryCreateDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ClassificationCategoryCreateDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ClassificationCategoryCreateDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ClassificationCategoryCreateDto> mapFromJson(dynamic json) {
    final map = <String, ClassificationCategoryCreateDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ClassificationCategoryCreateDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ClassificationCategoryCreateDto-objects as value to a dart map
  static Map<String, List<ClassificationCategoryCreateDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ClassificationCategoryCreateDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ClassificationCategoryCreateDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'name',
    'prompts',
  };
}

/// Action on match
class ClassificationCategoryCreateDtoActionEnum {
  /// Instantiate a new enum with the provided [value].
  const ClassificationCategoryCreateDtoActionEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const tag = ClassificationCategoryCreateDtoActionEnum._(r'tag');
  static const tagAndArchive = ClassificationCategoryCreateDtoActionEnum._(r'tag_and_archive');

  /// List of all possible values in this [enum][ClassificationCategoryCreateDtoActionEnum].
  static const values = <ClassificationCategoryCreateDtoActionEnum>[
    tag,
    tagAndArchive,
  ];

  static ClassificationCategoryCreateDtoActionEnum? fromJson(dynamic value) => ClassificationCategoryCreateDtoActionEnumTypeTransformer().decode(value);

  static List<ClassificationCategoryCreateDtoActionEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ClassificationCategoryCreateDtoActionEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ClassificationCategoryCreateDtoActionEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [ClassificationCategoryCreateDtoActionEnum] to String,
/// and [decode] dynamic data back to [ClassificationCategoryCreateDtoActionEnum].
class ClassificationCategoryCreateDtoActionEnumTypeTransformer {
  factory ClassificationCategoryCreateDtoActionEnumTypeTransformer() => _instance ??= const ClassificationCategoryCreateDtoActionEnumTypeTransformer._();

  const ClassificationCategoryCreateDtoActionEnumTypeTransformer._();

  String encode(ClassificationCategoryCreateDtoActionEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a ClassificationCategoryCreateDtoActionEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  ClassificationCategoryCreateDtoActionEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'tag': return ClassificationCategoryCreateDtoActionEnum.tag;
        case r'tag_and_archive': return ClassificationCategoryCreateDtoActionEnum.tagAndArchive;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [ClassificationCategoryCreateDtoActionEnumTypeTransformer] instance.
  static ClassificationCategoryCreateDtoActionEnumTypeTransformer? _instance;
}


