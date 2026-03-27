//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ClassificationCategoryResponseDto {
  /// Returns a new [ClassificationCategoryResponseDto] instance.
  ClassificationCategoryResponseDto({
    required this.action,
    required this.createdAt,
    required this.enabled,
    required this.id,
    required this.name,
    this.prompts = const [],
    required this.similarity,
    required this.tagId,
    required this.updatedAt,
  });

  ClassificationCategoryResponseDtoActionEnum action;

  String createdAt;

  bool enabled;

  String id;

  String name;

  List<String> prompts;

  num similarity;

  String? tagId;

  String updatedAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ClassificationCategoryResponseDto &&
    other.action == action &&
    other.createdAt == createdAt &&
    other.enabled == enabled &&
    other.id == id &&
    other.name == name &&
    _deepEquality.equals(other.prompts, prompts) &&
    other.similarity == similarity &&
    other.tagId == tagId &&
    other.updatedAt == updatedAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (action.hashCode) +
    (createdAt.hashCode) +
    (enabled.hashCode) +
    (id.hashCode) +
    (name.hashCode) +
    (prompts.hashCode) +
    (similarity.hashCode) +
    (tagId == null ? 0 : tagId!.hashCode) +
    (updatedAt.hashCode);

  @override
  String toString() => 'ClassificationCategoryResponseDto[action=$action, createdAt=$createdAt, enabled=$enabled, id=$id, name=$name, prompts=$prompts, similarity=$similarity, tagId=$tagId, updatedAt=$updatedAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'action'] = this.action;
      json[r'createdAt'] = this.createdAt;
      json[r'enabled'] = this.enabled;
      json[r'id'] = this.id;
      json[r'name'] = this.name;
      json[r'prompts'] = this.prompts;
      json[r'similarity'] = this.similarity;
    if (this.tagId != null) {
      json[r'tagId'] = this.tagId;
    } else {
    //  json[r'tagId'] = null;
    }
      json[r'updatedAt'] = this.updatedAt;
    return json;
  }

  /// Returns a new [ClassificationCategoryResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ClassificationCategoryResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "ClassificationCategoryResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ClassificationCategoryResponseDto(
        action: ClassificationCategoryResponseDtoActionEnum.fromJson(json[r'action'])!,
        createdAt: mapValueOfType<String>(json, r'createdAt')!,
        enabled: mapValueOfType<bool>(json, r'enabled')!,
        id: mapValueOfType<String>(json, r'id')!,
        name: mapValueOfType<String>(json, r'name')!,
        prompts: json[r'prompts'] is Iterable
            ? (json[r'prompts'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        similarity: num.parse('${json[r'similarity']}'),
        tagId: mapValueOfType<String>(json, r'tagId'),
        updatedAt: mapValueOfType<String>(json, r'updatedAt')!,
      );
    }
    return null;
  }

  static List<ClassificationCategoryResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ClassificationCategoryResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ClassificationCategoryResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ClassificationCategoryResponseDto> mapFromJson(dynamic json) {
    final map = <String, ClassificationCategoryResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ClassificationCategoryResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ClassificationCategoryResponseDto-objects as value to a dart map
  static Map<String, List<ClassificationCategoryResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ClassificationCategoryResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ClassificationCategoryResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'action',
    'createdAt',
    'enabled',
    'id',
    'name',
    'prompts',
    'similarity',
    'tagId',
    'updatedAt',
  };
}


class ClassificationCategoryResponseDtoActionEnum {
  /// Instantiate a new enum with the provided [value].
  const ClassificationCategoryResponseDtoActionEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const tag = ClassificationCategoryResponseDtoActionEnum._(r'tag');
  static const tagAndArchive = ClassificationCategoryResponseDtoActionEnum._(r'tag_and_archive');

  /// List of all possible values in this [enum][ClassificationCategoryResponseDtoActionEnum].
  static const values = <ClassificationCategoryResponseDtoActionEnum>[
    tag,
    tagAndArchive,
  ];

  static ClassificationCategoryResponseDtoActionEnum? fromJson(dynamic value) => ClassificationCategoryResponseDtoActionEnumTypeTransformer().decode(value);

  static List<ClassificationCategoryResponseDtoActionEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ClassificationCategoryResponseDtoActionEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ClassificationCategoryResponseDtoActionEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [ClassificationCategoryResponseDtoActionEnum] to String,
/// and [decode] dynamic data back to [ClassificationCategoryResponseDtoActionEnum].
class ClassificationCategoryResponseDtoActionEnumTypeTransformer {
  factory ClassificationCategoryResponseDtoActionEnumTypeTransformer() => _instance ??= const ClassificationCategoryResponseDtoActionEnumTypeTransformer._();

  const ClassificationCategoryResponseDtoActionEnumTypeTransformer._();

  String encode(ClassificationCategoryResponseDtoActionEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a ClassificationCategoryResponseDtoActionEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  ClassificationCategoryResponseDtoActionEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'tag': return ClassificationCategoryResponseDtoActionEnum.tag;
        case r'tag_and_archive': return ClassificationCategoryResponseDtoActionEnum.tagAndArchive;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [ClassificationCategoryResponseDtoActionEnumTypeTransformer] instance.
  static ClassificationCategoryResponseDtoActionEnumTypeTransformer? _instance;
}


