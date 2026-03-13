//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

/// Member role
class SharedSpaceRole {
  /// Instantiate a new enum with the provided [value].
  const SharedSpaceRole._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const owner = SharedSpaceRole._(r'owner');
  static const editor = SharedSpaceRole._(r'editor');
  static const viewer = SharedSpaceRole._(r'viewer');

  /// List of all possible values in this [enum][SharedSpaceRole].
  static const values = <SharedSpaceRole>[
    owner,
    editor,
    viewer,
  ];

  static SharedSpaceRole? fromJson(dynamic value) => SharedSpaceRoleTypeTransformer().decode(value);

  static List<SharedSpaceRole> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SharedSpaceRole>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SharedSpaceRole.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [SharedSpaceRole] to String,
/// and [decode] dynamic data back to [SharedSpaceRole].
class SharedSpaceRoleTypeTransformer {
  factory SharedSpaceRoleTypeTransformer() => _instance ??= const SharedSpaceRoleTypeTransformer._();

  const SharedSpaceRoleTypeTransformer._();

  String encode(SharedSpaceRole data) => data.value;

  /// Decodes a [dynamic value][data] to a SharedSpaceRole.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  SharedSpaceRole? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'owner': return SharedSpaceRole.owner;
        case r'editor': return SharedSpaceRole.editor;
        case r'viewer': return SharedSpaceRole.viewer;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [SharedSpaceRoleTypeTransformer] instance.
  static SharedSpaceRoleTypeTransformer? _instance;
}

