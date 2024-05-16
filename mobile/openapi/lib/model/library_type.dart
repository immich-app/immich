//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class LibraryType {
  /// Instantiate a new enum with the provided [value].
  const LibraryType._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const UPLOAD = LibraryType._(r'UPLOAD');
  static const EXTERNAL = LibraryType._(r'EXTERNAL');

  /// List of all possible values in this [enum][LibraryType].
  static const values = <LibraryType>[
    UPLOAD,
    EXTERNAL,
  ];

  static LibraryType? fromJson(dynamic value) => LibraryTypeTypeTransformer().decode(value);

  static List<LibraryType> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <LibraryType>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = LibraryType.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [LibraryType] to String,
/// and [decode] dynamic data back to [LibraryType].
class LibraryTypeTypeTransformer {
  factory LibraryTypeTypeTransformer() => _instance ??= const LibraryTypeTypeTransformer._();

  const LibraryTypeTypeTransformer._();

  String encode(LibraryType data) => data.value;

  /// Decodes a [dynamic value][data] to a LibraryType.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  LibraryType? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'UPLOAD': return LibraryType.UPLOAD;
        case r'EXTERNAL': return LibraryType.EXTERNAL;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [LibraryTypeTypeTransformer] instance.
  static LibraryTypeTypeTransformer? _instance;
}

