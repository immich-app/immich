//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class AlbumUserRole {
  /// Instantiate a new enum with the provided [value].
  const AlbumUserRole._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const editor = AlbumUserRole._(r'editor');
  static const viewer = AlbumUserRole._(r'viewer');

  /// List of all possible values in this [enum][AlbumUserRole].
  static const values = <AlbumUserRole>[
    editor,
    viewer,
  ];

  static AlbumUserRole? fromJson(dynamic value) => AlbumUserRoleTypeTransformer().decode(value);

  static List<AlbumUserRole> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AlbumUserRole>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AlbumUserRole.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [AlbumUserRole] to String,
/// and [decode] dynamic data back to [AlbumUserRole].
class AlbumUserRoleTypeTransformer {
  factory AlbumUserRoleTypeTransformer() => _instance ??= const AlbumUserRoleTypeTransformer._();

  const AlbumUserRoleTypeTransformer._();

  String encode(AlbumUserRole data) => data.value;

  /// Decodes a [dynamic value][data] to a AlbumUserRole.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  AlbumUserRole? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'editor': return AlbumUserRole.editor;
        case r'viewer': return AlbumUserRole.viewer;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [AlbumUserRoleTypeTransformer] instance.
  static AlbumUserRoleTypeTransformer? _instance;
}

