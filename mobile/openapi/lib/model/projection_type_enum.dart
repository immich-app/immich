//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class ProjectionTypeEnum {
  /// Instantiate a new enum with the provided [value].
  const ProjectionTypeEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const EQUIRECTANGULAR = ProjectionTypeEnum._(r'EQUIRECTANGULAR');
  static const CUBEMAP = ProjectionTypeEnum._(r'CUBEMAP');
  static const CUBESTRIP = ProjectionTypeEnum._(r'CUBESTRIP');
  static const EQUIRECTANGULAR_STEREO = ProjectionTypeEnum._(r'EQUIRECTANGULAR_STEREO');
  static const CUBEMAP_STEREO = ProjectionTypeEnum._(r'CUBEMAP_STEREO');
  static const CUBESTRIP_STEREO = ProjectionTypeEnum._(r'CUBESTRIP_STEREO');
  static const CYLINDER = ProjectionTypeEnum._(r'CYLINDER');
  static const NONE = ProjectionTypeEnum._(r'NONE');

  /// List of all possible values in this [enum][ProjectionTypeEnum].
  static const values = <ProjectionTypeEnum>[
    EQUIRECTANGULAR,
    CUBEMAP,
    CUBESTRIP,
    EQUIRECTANGULAR_STEREO,
    CUBEMAP_STEREO,
    CUBESTRIP_STEREO,
    CYLINDER,
    NONE,
  ];

  static ProjectionTypeEnum? fromJson(dynamic value) => ProjectionTypeEnumTypeTransformer().decode(value);

  static List<ProjectionTypeEnum>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ProjectionTypeEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ProjectionTypeEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [ProjectionTypeEnum] to String,
/// and [decode] dynamic data back to [ProjectionTypeEnum].
class ProjectionTypeEnumTypeTransformer {
  factory ProjectionTypeEnumTypeTransformer() => _instance ??= const ProjectionTypeEnumTypeTransformer._();

  const ProjectionTypeEnumTypeTransformer._();

  String encode(ProjectionTypeEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a ProjectionTypeEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  ProjectionTypeEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'EQUIRECTANGULAR': return ProjectionTypeEnum.EQUIRECTANGULAR;
        case r'CUBEMAP': return ProjectionTypeEnum.CUBEMAP;
        case r'CUBESTRIP': return ProjectionTypeEnum.CUBESTRIP;
        case r'EQUIRECTANGULAR_STEREO': return ProjectionTypeEnum.EQUIRECTANGULAR_STEREO;
        case r'CUBEMAP_STEREO': return ProjectionTypeEnum.CUBEMAP_STEREO;
        case r'CUBESTRIP_STEREO': return ProjectionTypeEnum.CUBESTRIP_STEREO;
        case r'CYLINDER': return ProjectionTypeEnum.CYLINDER;
        case r'NONE': return ProjectionTypeEnum.NONE;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [ProjectionTypeEnumTypeTransformer] instance.
  static ProjectionTypeEnumTypeTransformer? _instance;
}

