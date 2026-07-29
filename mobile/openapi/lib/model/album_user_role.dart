//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

/// Album user role
enum AlbumUserRole {
  editor._(r'editor'),
  owner._(r'owner'),
  viewer._(r'viewer'),
  ;

  /// Instantiate a new enum with the provided value.
  const AlbumUserRole._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [AlbumUserRole] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static AlbumUserRole? fromJson(dynamic value) => AlbumUserRoleTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [AlbumUserRole]
  /// that were successfully decoded from the passed [JSON][json].
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

  /// Encodes this enum as a value suitable for JSON.
  String encode(AlbumUserRole data) => data._value;

  /// Returns the instance of [AlbumUserRole] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  AlbumUserRole? decode(dynamic data, {bool allowNull = true}) {
    if (data is AlbumUserRole) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'editor': return AlbumUserRole.editor;
        case r'owner': return AlbumUserRole.owner;
        case r'viewer': return AlbumUserRole.viewer;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static AlbumUserRoleTypeTransformer? _instance;
}

