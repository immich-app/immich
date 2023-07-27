//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class ProjectionType {
  /// Instantiate a new enum with the provided [value].
  const ProjectionType._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const EQUIRECTANGULAR = ProjectionType._(r'EQUIRECTANGULAR');
  static const CUBEMAP = ProjectionType._(r'CUBEMAP');
  static const CUBESTRIP = ProjectionType._(r'CUBESTRIP');
  static const EQUIRECTANGULAR_STEREO = ProjectionType._(r'EQUIRECTANGULAR_STEREO');
  static const CUBEMAP_STEREO = ProjectionType._(r'CUBEMAP_STEREO');
  static const CUBESTRIP_STEREO = ProjectionType._(r'CUBESTRIP_STEREO');
  static const CYLINDER = ProjectionType._(r'CYLINDER');
  static const NONE = ProjectionType._(r'NONE');

  /// List of all possible values in this [enum][ProjectionType].
  static const values = <ProjectionType>[
    EQUIRECTANGULAR,
    CUBEMAP,
    CUBESTRIP,
    EQUIRECTANGULAR_STEREO,
    CUBEMAP_STEREO,
    CUBESTRIP_STEREO,
    CYLINDER,
    NONE,
  ];

  static ProjectionType? fromJson(dynamic value) => ProjectionTypeTypeTransformer().decode(value);

  static List<ProjectionType>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ProjectionType>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ProjectionType.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [ProjectionType] to String,
/// and [decode] dynamic data back to [ProjectionType].
class ProjectionTypeTypeTransformer {
  factory ProjectionTypeTypeTransformer() => _instance ??= const ProjectionTypeTypeTransformer._();

  const ProjectionTypeTypeTransformer._();

  String encode(ProjectionType data) => data.value;

  /// Decodes a [dynamic value][data] to a ProjectionType.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  ProjectionType? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'EQUIRECTANGULAR': return ProjectionType.EQUIRECTANGULAR;
        case r'CUBEMAP': return ProjectionType.CUBEMAP;
        case r'CUBESTRIP': return ProjectionType.CUBESTRIP;
        case r'EQUIRECTANGULAR_STEREO': return ProjectionType.EQUIRECTANGULAR_STEREO;
        case r'CUBEMAP_STEREO': return ProjectionType.CUBEMAP_STEREO;
        case r'CUBESTRIP_STEREO': return ProjectionType.CUBESTRIP_STEREO;
        case r'CYLINDER': return ProjectionType.CYLINDER;
        case r'NONE': return ProjectionType.NONE;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [ProjectionTypeTypeTransformer] instance.
  static ProjectionTypeTypeTransformer? _instance;
}

